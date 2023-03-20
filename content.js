console.log('STARTING');

const numberWithCommas = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

('use strict');
let hasRun = false;

const calculateHotelScore = (item) => {
  let combinedScore = 0;
  // get the rating count
  let reviewsElement = item.querySelector('[data-testid="review-score"]');
  if (reviewsElement) {
    let avgRating = reviewsElement.querySelector('div').textContent;
    let avgRatingAsPercentage = parseFloat(avgRating) / 10;

    let numOfRatingsElement = reviewsElement.querySelector(
      'div:nth-child(2) > div:nth-child(2)'
    ).textContent;

    let numOfRatings = parseInt(numOfRatingsElement.replace('Reviews', '').replace(/,/g, ''));

    combinedScore = Math.round(numOfRatings * Math.pow(avgRatingAsPercentage, 15));

    scoreElement = document.createElement('span');
    scoreElement.className = 'score';
    scoreElement.style = `font-weight:600;
    `;
    reviewsElement.appendChild(scoreElement);
    scoreElement.innerHTML = `${numberWithCommas(combinedScore)}`;
  }
  return combinedScore;
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
    } else combinedScore = calculateHotelScore(item);

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
  const sortingDropdown = document.querySelector('[data-testid="sorters-dropdown-trigger"]');
  const sortingDropdownContainer = sortingDropdown.parentElement;

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

  sortingDropdownContainer.appendChild(sortButton);

  sortingDropdownContainer.style = 'display: flex; justify-content: space-between;';

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
      appendSortingButton();
  }
});
