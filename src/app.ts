import ffmpeg from 'fluent-ffmpeg'
import { PassThrough, Readable } from 'stream'
import Timeout = NodeJS.Timeout
import { interval } from 'rxjs'

/**
 * E.g. Media Source Segmentation
 */

// Ref: https://bitmovin.com/mpeg-dash-hls-examples-sample-streams/
const MEDIA_SOURCE = 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
// m3u8 으로는 아래 코드가 기대한대로 동작하지 않는다.

// const MEDIA_SOURCE = 'https://www.radiantmediaplayer.com/media/big-buck-bunny-360p.mp4'
// mp4 는 segmentation 잘 됨, 그러나 'data' 이벤트는 안 불림.

const SEGMENT_TIME_IN_SEC = 10

function segmentMediaSource (mediaSource: string, segmentTimeInSec: number) {
  const command = ffmpeg(mediaSource)
    .addOptions([
      '-c copy',
      '-map 0',
      '-f segment',
      `-segment_time ${segmentTimeInSec}`
    ])
    .output('./segments/segment_%03d.ts')
    .on('data', () => {
      console.log('data')
    })
    .on('error', (error) => {
      console.log('Error occurred!\n', error)
    })

  command.run()
}

// segmentMediaSource(MEDIA_SOURCE, SEGMENT_TIME_IN_SEC)

/**
 * E.g. Periodic stream. - This is not working. TODO: Figure out why.
 */

interface PeriodicStream {
  create(): Readable
  start(duration: number): void
  destroy(): void
}


class CreateSequenceStreamService implements PeriodicStream {
  private stream: Readable | undefined
  private sequence: number | undefined
  private timeout: Timeout | undefined

  start(duration: number): void {
    this.timeout = setInterval(() => {
      if (!this.stream || !this.sequence) {
        throw new Error('Stream or sequence cannot be undefined.')
      }

      this.stream.push(this.sequence)
      this.sequence++
    }, duration)
  }

  destroy (): void {
    if (this.timeout) {
      clearInterval(this.timeout)
    }

    this.stream?.destroy()
  }

  create (): Readable {
    this.sequence = 0
    this.stream = new PassThrough({
      objectMode: true
    })
    return this.stream
  }
}

function createPeriodicStream () {
  const createSequenceStreamService = new CreateSequenceStreamService()
  const stream = createSequenceStreamService.create()
  createSequenceStreamService.start(SEGMENT_TIME_IN_SEC * 1000)

  stream.on('data', (data) => {
    console.log('periodic: ', data)
  })
}

// createPeriodicStream()

/**
 * E.g. Using rxjs.
 */

const seconds = interval(1000)

const subscription = seconds
  .subscribe(
    value => {
      console.log(value)
    },
    err => console.log(err),
  )

setTimeout(() => {
  subscription.unsubscribe()
}, 5000)
