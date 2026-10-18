const projectLogos = {
  parkiva: { src: 'parkiva.png', alt: 'Parkiva project thumbnail' },
  salesforceQuiz: { src: 'salesforce-quiz.png', alt: 'Salesforce LWC Quiz App project thumbnail' },
  authentiscan: { src: 'authentiscan.png', alt: 'AuthentiScan project thumbnail' },
  imageStitching: { src: 'image-stitching.png', alt: 'Image Stitching project thumbnail' },
  youtubeDownloader: { src: 'youtube-downloader.png', alt: 'YouTube Video Downloader project thumbnail' },
  virtualMouse: { src: 'virtual-mouse.png', alt: 'Virtual Mouse project thumbnail' },
  movieRecommendation: { src: 'movie-recommendation.png', alt: 'Movie Recommendation System project thumbnail' },
  artograph: { src: 'artograph.png', alt: 'Artograph project thumbnail' },
  licencePlateDetector: { src: 'licence-plate-detector.png', alt: 'Licence Plate Detector project thumbnail' },
  portfolioWebsite: { src: 'portfolio-website.png', alt: 'Portfolio Website project thumbnail' },
  calculator: { src: 'calculator.png', alt: 'Calculator project thumbnail' },
  imageGallery: { src: 'image-gallery.png', alt: 'Image Gallery project thumbnail' },
  cardiovascularDisease: { src: 'cardiovascular-disease.png', alt: 'Cardiovascular Disease Detection project thumbnail' },
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
