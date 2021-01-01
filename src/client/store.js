let state = window.state = {
    puzzleData: {},
};

// const saveState = () => {
//     localStorage.setItem('puzzlestate', JSON.stringify(state));
// };

// const loadState = () => {
//     const localJSON = localStorage.getItem('puzzlestate');
//     if (localJSON === null) {
//         return;
//     }
//     state = JSON.parse(localJSON);
// };
// loadState();

// const stateHandler = {
//     get: function (obj, prop) {
//         return obj[prop];
//     },
//     set: function (obj, prop, value) {
//         obj[prop] = value;
//         saveState();
//     }
// };

export const store = state;