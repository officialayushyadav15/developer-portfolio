const projectLinks = {
  parkiva: 'https://github.com/officialayushyadav15/parking_management_system',
  salesforceQuiz: 'https://github.com/officialayushyadav15/lwc-quiz-app',
  authentiscan: 'https://github.com/officialayushyadav15/fake-news-detector',
  imageStitching: 'https://github.com/officialayushyadav15/seam-carving',
  cardiovascularDisease: 'https://github.com/officialayushyadav15/early_cardio_vascular_disease_detection_system',
  youtubeDownloader: 'https://github.com/officialayushyadav15/youtube_downloader',
  virtualMouse: 'https://github.com/officialayushyadav15/virtual-mouse-using-hand-gesture',
  movieRecommendation: 'https://github.com/officialayushyadav15/movie-recomender-system-project',
  artograph: 'https://github.com/officialayushyadav15/image-to-sketch',
  licencePlateDetector: 'https://github.com/officialayushyadav15/licence_plate_detector',
  portfolioWebsite: 'https://github.com/officialayushyadav15/developer-portfolio',
  calculator: 'https://github.com/officialayushyadav15/codealpha_calculator',
  imageGallery: 'https://github.com/officialayushyadav15/codealpha_imagegallery',
  abiltex: 'https://github.com/officialayushyadav15'
};

window.applyProjectLinks = () => {
  document.querySelectorAll('[data-project-link]').forEach(link => {
    const key = link.dataset.projectLink;
    link.href = projectLinks[key] || projectLinks.parkiva;
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.applyProjectLinks);
} else {
  window.applyProjectLinks();
}
