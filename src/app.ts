import ffmpeg from 'fluent-ffmpeg'

// Ref: https://bitmovin.com/mpeg-dash-hls-examples-sample-streams/
const MEDIA_SOURCE = 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
// m3u8 으로는 아래 코드가 기대한대로 동작하지 않는다.

// const MEDIA_SOURCE = 'https://www.radiantmediaplayer.com/media/big-buck-bunny-360p.mp4'
// mp4 는 segmentation 잘 됨, 그러나 'data' 이벤트는 안 불림.

const SEGMENT_TIME_IN_SEC = 10

const command = ffmpeg(MEDIA_SOURCE)
  .addOptions([
    '-c copy',
    '-map 0',
    '-f segment',
    `-segment_time ${SEGMENT_TIME_IN_SEC}`
  ])
  .output('./segments/segment_%03d.ts')
  .on('data', () => {
    console.log('data')
  })
  .on('error', (error) => {
    console.log('Error occurred!\n', error)
  })

command.run()
