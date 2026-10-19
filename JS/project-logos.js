const projectLogos = {
  parkiva: { src: 'parkiva.jpg', alt: 'Parkiva project thumbnail' },
  salesforceQuiz: { src: 'salesforce-quiz.jpg', alt: 'Salesforce LWC Quiz App project thumbnail' },
  authentiscan: { src: 'authentiscan.jpg', alt: 'AuthentiScan project thumbnail' },
  imageStitching: { src: 'image-stitching.jpg', alt: 'Image Stitching project thumbnail' },
  youtubeDownloader: { src: 'youtube-downloader.jpg', alt: 'YouTube Video Downloader project thumbnail' },
  virtualMouse: { src: 'virtual-mouse.jpg', alt: 'Virtual Mouse project thumbnail' },
  movieRecommendation: { src: 'movie-recommendation.jpg', alt: 'Movie Recommendation System project thumbnail' },
  artograph: { src: 'artograph.jpg', alt: 'Artograph project thumbnail' },
  licencePlateDetector: { src: 'licence-plate-detector.png', alt: 'Licence Plate Detector project thumbnail' },
  portfolioWebsite: { src: 'portfolio-website.jpg', alt: 'Portfolio Website project thumbnail' },
  calculator: { src: 'calculator.png', alt: 'Calculator project thumbnail' },
  imageGallery: { src: 'image-gallery.jpg', alt: 'Image Gallery project thumbnail' },
  cardiovascularDisease: { src: 'cardiovascular-disease.jpg', alt: 'Cardiovascular Disease Detection project thumbnail' },
  abiltex: { src: 'abiltex.png', alt: 'Abiltex project thumbnail' }
};

window.applyProjectLogos = () => {
  document.querySelectorAll('[data-project-logo]').forEach(logo => {
    const projectLogo = projectLogos[logo.dataset.projectLogo];
    if (!projectLogo) {
      logo.innerHTML = '';
      return;
    }
    const prefix = location.pathname.includes('/pages/') ? '../' : '';
    logo.innerHTML = `<img src="${prefix}IMAGES/project-thumbnails/${projectLogo.src}" alt="${projectLogo.alt}" loading="lazy">`;
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.applyProjectLogos);
} else {
  window.applyProjectLogos();
}
