'use strict';

//////////////////////////////////////////////////////////////

// DOM nodes

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

////////////////////////////////////////////////////////////////

// HANDLE USER INPUT

// Base class
class Workout {
  createdAt = new Date();
  date = Date.now();
  id = (this.date + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDate() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this._description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on 
    ${months[new Date().getMonth()]} ${new Date().getDate()}`;
  }

  // whoAmI(){
  //   this.whoAmI = "I am the parent class !";
  // }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDate();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDate();
  }

  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

// const run1 = new Running([-39, 28], 22, 21, 19);
// const cyc1 = new Running([-39, 28], 52, 11, 19);

// console.log(run1, cyc1);

// /////////////////////////////////////////////////////////////////

// APP ARCHITECTURE

class App {
  // Private attributes
  _map;
  _mapSet;
  _position;
  _workoutArr = [];
  _markerPtr = null;

  // Intitial Steps
  constructor() {
    this._getPosition();
    containerWorkouts.addEventListener('click', this._moveToPos);
    form.addEventListener('submit', e => {
      e.preventDefault();
      this._newWorkOut.call(this);
    });

    inputType.addEventListener('change', e => this._toggleElevationField());
  }

  // Private methods

  // To get current position
  _getPosition = () => {
    navigator.geolocation.getCurrentPosition((pos, err) => {
      if (pos) {
        this._position = pos;
        this._loadMap(pos);
      }
    });
  };

  _createMarker(obj) {
    this._markerPtr = L.marker(obj.latlng)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
        })
      )
      .setPopupContent('Add your workout')
      .openPopup();

    this._map.addLayer(this._markerPtr);
  }

  // To get load the map
  _loadMap(position) {
    const { latitude: lat, longitude: lon } = position.coords;
    const coords = [lat, lon];

    this._map = L.map('map').setView(coords, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    L.marker(coords)
      .addTo(this._map)
      .bindPopup()
      .setPopupContent('Your location')
      .openPopup();

    this._getLocalStorage();  
    this._workoutArr.forEach(work => {
      this._renderMarker(work, work.type);
    });

    this._map.on('click', obj => {
      this._showForm.call(this, obj);
      this._createMarker(obj);
    });
  }

  // To show the form for user input
  _showForm(newCoords) {
    if (this._markerPtr) {
      console.log('Hello');
      this._map.removeLayer(this._markerPtr);
    }

    const { lat, lng } = newCoords.latlng;
    this._mapSet = [lat, lng];
    form.classList.remove('hidden');
    // console.log(this._mapSet);
  }

  // Handle a change event
  _toggleElevationField = () => {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  };

  // To add new workout
  _newWorkOut() {
    let run;
    let cyc;
    // For checking all inputs are numbers
    function checkIsNum(num) {
      num.every(n => !Number.isFinite(n));
    }

    // Get user input
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elev = +inputElevation.value;

    // decider
    let workout = type === 'running' ? 'Running' : 'Cycling';

    // validation
    if (
      checkIsNum([distance, duration, cadence, elev]) ||
      distance === '' ||
      duration === '' ||
      distance <= 0 ||
      duration <= 0
    ) {
      alert('Please enter a number');
      return;
    }

    // check the type of data
    if (type === 'running' && cadence > 0 && cadence !== '') {
      run = new Running(this._mapSet, distance, duration, cadence);
      this._workoutArr.push(run);
    } else if (type === 'cycling' && elev > 0 && elev !== '') {
      cyc = new Cycling(this._mapSet, distance, duration, elev);
      this._workoutArr.push(cyc);
    } else {
      alert('Please enter a valid positive number');
      return;
    }

    // clearing user input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    // Creating marker with pop-up based on above code 👆

    // closing previous marker
    this._markerPtr.closePopup();

    // storing different workout obj
    let w = type === 'running' ? run : cyc;

    // Adding a new marker
    this._renderMarker(w, type);

    // Test
    console.log(this._workoutArr);

    // Hides the form
    form.classList.add('hidden');

    // To set the local storage for the workouts
    this._setLocalStorage();

    // To render the workouts
    this._renderWorkout(w, type);
  }

  _renderMarker(workout, type) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${type}-popup`,
        })
      )
      .setPopupContent(
        `${type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout._description}`
      )
      .openPopup();
  }

  _renderWorkout(workout, type) {
    let html = `
      <li class="workout workout--${type}" data-id=${workout.id}>
      <h2 class="workout__title">${workout._description}</h2>

      <div class="workout__details">
        <span class="workout__icon">${type === 'running' ? '🏃' : '🚴‍♀️'}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>

      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>  

    `;
    if (type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">min/km</span>
        </div>

        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">spm</span>
        </div>
      `;
    } else {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>

        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPos = e => {
    const workoutEl = e.target.closest('li');
    if (!workoutEl) return;

    const workout = this._workoutArr.find(
      work => work.id === workoutEl.dataset.id
    );

    this._map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    console.log(workout);
  };

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this._workoutArr));
  }

  _getLocalStorage() {
    if (this._position) {
      const data = JSON.parse(localStorage.getItem('workouts'));
      if (!data) return;

      this._workoutArr = data;
      this._workoutArr.forEach(work => {
        this._renderWorkout(work, work.type);
      });

      // this._clearLocalStorage();
    }
  }

  _clearLocalStorage() {
    const oneDay = 1000 * 60 * 60 * 24;
    setTimeout(() => {
      localStorage.clear();
      console.log('Cleared local storage');
    }, 1000);
  }
}

// Instance of the App Class
const obj1 = new App();
