const graphqlEndpoint = 'https://www.booking.com/dml/graphql?';

function waitForHotelId(callback) {
  const checkInterval = setInterval(() => {
    const hotelIdInput = document.querySelector('input[name="hotel_id"]');
    if (hotelIdInput && hotelIdInput.value) {
      clearInterval(checkInterval);
      callback(hotelIdInput.value);
    }
  }, 500);
}

waitForHotelId((hotelId) => {
  const destId = document.querySelector('input[name="dest_id"]').value;

  const createPayload = (skip) => ({
    operationName: 'ReviewList',
    variables: {
      input: {
        hotelId: parseInt(hotelId),
        hotelCountryCode: 'gr',
        ufi: parseInt(destId),
        sorter: 'NEWEST_FIRST',
        filters: { text: '' },
        skip: skip,
        limit: 25,
      },
    },
    extensions: {},
    query: `query ReviewList($input: ReviewListFrontendInput!) {
      reviewListFrontend(input: $input) {
        ... on ReviewListFrontendResult {
          reviewCard {
            reviewScore
            guestDetails {
              countryName
            }
            bookingDetails {
              customerType
              roomType {
                name
              }
              checkoutDate
            }
          }
        }
      }
    }`,
  });
  const fetchReviews = (skip) =>
    fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(createPayload(skip)),
    }).then((response) => response.json());

  Promise.allSettled([fetchReviews(0), fetchReviews(25), fetchReviews(50), fetchReviews(75)])
    .then((results) => {
      const allReviews = results
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value.data.reviewListFrontend.reviewCard);

      const customerTypes = [
        ...new Set(allReviews.map((review) => review.bookingDetails.customerType)),
      ];
      const roomTypes = [
        ...new Set(allReviews.map((review) => review.bookingDetails.roomType.name)),
      ];

      const wrapperElement = document.createElement('div');
      wrapperElement.style.display = 'flex';
      wrapperElement.style.flexDirection = 'column';
      wrapperElement.style.alignItems = 'center';
      wrapperElement.style.gap = '10px';
      wrapperElement.style.borderTop = '1px solid #ccc';
      wrapperElement.style.padding = '10px 12px'; // Increased padding
      wrapperElement.style.margin = '10px 0'; // Added margin

      const titleElement = document.createElement('div');
      titleElement.textContent = 'Recent Reviews Summary';
      titleElement.style.color = '#003580'; // Booking.com blue color
      titleElement.style.fontWeight = '500';
      titleElement.style.textAlign = 'left';

      const scoreElement = document.createElement('div');
      scoreElement.style.display = 'inline-block';

      const scoreTitleWrapper = document.createElement('div');
      scoreTitleWrapper.style.display = 'flex';
      scoreTitleWrapper.style.gap = '10px';
      scoreTitleWrapper.appendChild(titleElement);
      scoreTitleWrapper.appendChild(scoreElement);

      const createDropdown = (options, label) => {
        const select = document.createElement('select');
        select.style.padding = '5px';
        select.style.borderRadius = '4px';
        select.style.width = '100%';
        select.innerHTML =
          `<option value="">${label}</option>` +
          options.map((option) => `<option value="${option}">${option}</option>`).join('');
        return select;
      };

      const customerTypeDropdown = createDropdown(customerTypes, 'All guest types');
      const roomTypeDropdown = createDropdown(roomTypes, 'All room types');

      const calculateScore = (customerType, roomType) => {
        const filteredReviews = allReviews.filter(
          (review) =>
            (!customerType || review.bookingDetails.customerType === customerType) &&
            (!roomType || review.bookingDetails.roomType.name === roomType)
        );

        const score = filteredReviews.reduce((acc, review) => {
          const rating = review.reviewScore;
          if (rating >= 9) return acc + 1;
          if (rating <= 2) return acc - 1;
          return acc;
        }, 0);

        const percentage = ((score / filteredReviews.length) * 100).toFixed(0);

        // Update score text and color
        scoreElement.textContent = `${percentage}% positive`;
        scoreElement.style.color = getColorForPercentage(percentage);

        // Update the review count
        reviewCountElement.textContent = `Based on ${filteredReviews.length} reviews`;
      };

      const getColorForPercentage = (percentage) => {
        let hue, saturation, lightness;
        if (percentage < 50) {
          // Dark red for low percentages
          hue = 0;
          saturation = 80;
          lightness = 30;
        } else if (percentage < 65) {
          // Dark yellow for 50-65
          hue = 45;
          saturation = 80;
          lightness = 35;
        } else {
          // Dark green that gets slightly brighter from 65 up
          hue = 120;
          saturation = 70;
          lightness = Math.min(30 + (percentage - 65) * 0.5, 40); // Caps at 40% lightness
        }
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      };

      // Create a new element for displaying the review count
      const reviewCountElement = document.createElement('div');
      reviewCountElement.style.fontSize = '12px';
      reviewCountElement.style.color = '#6B6B6B';
      reviewCountElement.style.marginTop = '5px';

      calculateScore();

      [customerTypeDropdown, roomTypeDropdown].forEach((dropdown) => {
        dropdown.addEventListener('change', () => {
          calculateScore(customerTypeDropdown.value, roomTypeDropdown.value);
        });
      });

      wrapperElement.appendChild(scoreTitleWrapper);
      wrapperElement.appendChild(reviewCountElement); // Add reviewCountElement here
      wrapperElement.appendChild(customerTypeDropdown);
      wrapperElement.appendChild(roomTypeDropdown);

      const reviewScoreWrapper = document.querySelector('#js--hp-gallery-scorecard');
      reviewScoreWrapper.appendChild(wrapperElement);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});
