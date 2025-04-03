console.log('STARTING');

const numberWithCommas = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

('use strict');
let hasRun = false;

const calculateHotelScore = (item) => {
  let combinedScore = 0;
  let reviewsElement = item.querySelector('[data-testid="review-score"]');
  if (reviewsElement) {
    // Extract average rating
    let avgRating = parseFloat(reviewsElement.textContent.match(/\d+(\.\d+)?/)[0]);
    let avgRatingAsPercentage = avgRating / 10;

    // Extract number of ratings
    let numOfRatings = 0;
    let match = reviewsElement.textContent.match(/(\d+(?:,\d+)*)(?:\s*real)?\s*reviews?/i);
    if (match) {
      numOfRatings = parseInt(match[1].replace(/,/g, ''));
    }

    combinedScore = Math.round(numOfRatings * Math.pow(avgRatingAsPercentage, 15));

    let scoreElement = document.createElement('span');
    scoreElement.className = 'score';
    scoreElement.style = `font-weight:600;
    `;
    reviewsElement.appendChild(scoreElement);
    scoreElement.innerHTML = `${numberWithCommas(combinedScore)}`;

    // cache the score using the URL as the key
    localStorage.setItem(item.querySelector('a').href, combinedScore);
  }
  return combinedScore;
};

const getCachedHotelScore = (item) => {
  const hotelUrl = item.querySelector('a').href;
  const cachedScore = localStorage.getItem(hotelUrl);
  return cachedScore ? parseInt(cachedScore) : null;
};

const sortBookingResults = () => {
  if (hasRun) return;

  const itemsArr = []; // to contain items [reviewcount, itemHtml] sorted by reviewcount

  let items = document.querySelectorAll('[data-testid="property-card"]');
  for (let item of items) {
    let combinedScore = 0;
    let scoreElement = item.querySelector('.score');
    if (scoreElement) {
      combinedScore = parseInt(scoreElement.innerHTML.replace(/,/g, ''));
    } else {
      // check if the score is already cached
      const cachedScore = getCachedHotelScore(item);
      if (cachedScore !== null) {
        combinedScore = cachedScore;
      } else {
        combinedScore = calculateHotelScore(item);
      }
    }

    itemsArr.push([combinedScore, item.cloneNode(true)]);
  }

  // sort the items by review count
  itemsArr.sort(sortFunction);

  // in place sorting
  for (let i = 0; i < items.length; i++) {
    // if we ran out of
    if (!itemsArr[i]) {
      break;
    }
    items[i].innerHTML = itemsArr[i][1].innerHTML;
  }
  hasRun = true;
};

function sortFunction(a, b) {
  if (a[0] === b[0]) {
    return 0;
  } else {
    return a[0] < b[0] ? 1 : -1;
  }
}

const appendSortingButton = () => {
  const header = document.querySelector('h1');
  const headerContainer = header.parentElement;

  const sortButton = document.createElement('button');
  sortButton.id = 'sort-by-score-button';
  sortButton.style = `
  border-radius: 8px;
  box-shadow: blue 1px 1px;
  background-color: #0071c2;
  color: white;
  margin-top: 10px;
  padding: 10px;
  font-weight: bold;
  `;
  sortButton.innerHTML = 'Sort by score';

  headerContainer.appendChild(sortButton);

  headerContainer.style = 'display: flex; justify-content: space-between; align-items: center;';

  sortButton.addEventListener('click', () => {
    sortBookingResults();
  });
};
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === 'TabUpdated') {
    hasRun = false;
    if (
      document.querySelector('[data-testid="property-card"]') &&
      !document.querySelector('#sort-by-score-button')
    )
      setTimeout(() => {
        appendSortingButton();
      }, 1500);
  }
});
