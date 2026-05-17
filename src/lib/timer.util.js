// A timer class with methods for start, pause, stop, reset and get elapsed time
export default class Timer {
  constructor() {
    console.log('timer created')
    this.reset()
  }

  get elapsedTime() {
    console.log('getting elapsed time')
    return this.isRunning ? Date.now() - this.startTime + this.accumulatedTime : this.accumulatedTime
  }

  start() {
    if (!this.isRunning) {
      console.log('time starting')
      this.isRunning = true
      this.startTime = Date.now()
    }
  }

  pause() {
    if (this.isRunning) {
      console.log('timer pause')
      this.isRunning = false
      this.accumulatedTime += Date.now() - this.startTime
    }
  }

  reset() {
    console.log('timer reset')
    this.isRunning = false
    this.startTime = 0
    this.accumulatedTime = 0
  }

  getElapsedTimeISO() {
    console.log('timer value iso')
    return new Date(this.elapsedTime).toISOString().substr(11, 8)
  }

  getElapsedTimeFormatted() {
    console.log('time vaue formatted')
    const totalSeconds = Math.floor(this.elapsedTime / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return [hours, minutes, seconds].map(this.padTime).join(':')
  }

  padTime(time) {
    return time.toString().padStart(2, '0')
  }
}
