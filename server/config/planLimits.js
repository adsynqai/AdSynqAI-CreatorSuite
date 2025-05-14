// config/planLimits.js
module.exports = {
  'Free Trial': {
    image: 1,
    audio: 1,
    video: 0,
    publish: 0,
    users: 1
  },
  'Starter': {
    image: 10,
    audio: 10,
    video: 1,
    publish: 5,
    users: 1
  },
  'Pro': {
    image: 30,
    audio: 30,
    video: 2,
    publish: 15,
    users: 1
  },
  'Business': {
    image: 100,
    audio: 60,
    video: 2,
    publish: 30,
    users: 1
  },
  'Professional': {
    image: 200,
    audio: 90,
    video: 4,
    publish: 50,
    users: 3
  },
  'Agency': {
    image: 250,
    audio: 300,
    video: 10,
    publish: 100,
    users: 5
  },
  'Agency Plus': {
    image: 500,
    audio: 600,
    video: 20,
    publish: 200,
    users: 10
  }
};
