// Video-hoi reels bo ovozi voqe'i (H.264 + AAC; ovoz dar brauzer tekshirida shud: rms > 0).
// Seed va reels-sound.js hamin ruyxatro istifoda mebarand.
//  - Sintel, Big Buck Bunny: Blender Foundation, CC-BY 3.0 (blender.org)
//  - friday: MDN, CC0
//  - movie_300: W3C test media (Big Buck Bunny, CC-BY 3.0)
//  - sample-5s / sample-10s: samplelib.com (ozod baroi istifoda)
module.exports = [
  { url: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4', file: 'seed-reel-sintel.mp4' },
  { url: 'https://download.blender.org/peach/trailer/trailer_iphone.m4v', file: 'seed-reel-bunny.mp4' },
  { url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', file: 'seed-reel-sample5.mp4' },
  { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4', file: 'seed-reel-friday.mp4' },
  { url: 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', file: 'seed-reel-sample10.mp4' },
  { url: 'https://media.w3.org/2010/05/video/movie_300.mp4', file: 'seed-reel-movie300.mp4' },
];
