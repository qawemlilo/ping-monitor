/* eslint-disable no-unused-vars */

class Channel {

  constructor(options) {
    this.options = options;
  }

  name = 'slacker';

  async up(res, state) {
    console.log(`#${this.name} ${res.website} is up`);
  }

  async down(res, state) {
    console.log(`#${this.name} ${res.website} is down`);
  }

  async stop(res, state) {
    console.log(`#${this.name} ${res.website} has stopped`);
  }

  async error(error, res) {
    console.log(`#${this.name}`, error);
  }

  async timeout(error, res) {
    console.log(`#${this.name}`, error);
  }

  async restored(res, state) {
    console.log(`#${this.name} ${res.website} has been restored`);
  }
}


module.exports = Channel;
