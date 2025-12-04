import { API_GET, API_POST } from "./api/client.js";

const app = Vue.createApp({
  data() {
    let today = new Date();
    return {
      // general site data
      siteName: "Alexville Afterschool Activities",
      showShop: true,
      showCheckout: false,
      showDropdownCart: false,
      showCalendar: false,
      activities: activities,

      selectedActivity: null,

      // sort data
      SORT_TYPES: window.SORT_TYPES, // inject sort type enum
      sortType: SORT_TYPES.EARLIEST_FIRST, // default to earliest first

      // cart data
      cart: [],
      cartItemCount: 0,
      totalCartPrice: 0,

      // customer data
      customer: {
        name: null,
        phoneNumber: null,
        cardNumber: null,
      },

      // calendar data
      WEEKDAYS:window.WEEKDAYS,
      displayedMonth: today.getMonth(),
      displayedYear: today.getFullYear(),
    

    };
  },

  methods: {
    // shop related methods

    // display functions
    hideAll() {
      this.showCalendar = false;
      this.showCheckout = false;
      this.showDropdownCart = false;
      this.showShop = false;
      this.selectedActivity = null;
    },
    openShop() { // store isntead of shop as if 2 things are called showShop that seems like a nightmare in the making
      this.hideAll();
      this.showShop = true;
    },
    toggleCartDropdown() {
      this.showDropdownCart = !this.showDropdownCart;
    },

    expandActivity(activity) {
      this.hideAll();
      this.selectedActivity = activity;
    },
    closeActivity() {
      this.openShop();
    },

    openCheckout() {
      this.hideAll();
      this.showCheckout = true;
    },
    closeCheckout() {
      this.openShop();
    },

    openCalendar() {
      this.hideAll();
      this.showCalendar = true;
    },
    closeCalendar() {
      this.openShop();
    },


    // cart functions
    addToCart(activity) {
      // try find existing copy of activity in cart
      const foundMatch = this.cart.find(item => item.id === activity.id)

      if (foundMatch != null) {
        foundMatch.quantity++; // increment the quantity
      } else { // build new cartObject instead as its the first instance of this item in the cart
        let cartObject = {
          id: activity.id,
          name: activity.name,
          price: activity.price,
          quantity: 1
        }
        this.cart.push(cartObject)
      }

      // the fact that I have to write it like this so stupid, fucking js man
      this.totalCartPrice = +this.totalCartPrice + +activity.price;
      this.cartItemCount++; // increment number of items in the cart
    },
    removeFromCart(activity) {
      // try find existing copy of activity in cart
      const foundMatch = this.cart.find(item => item.id === activity.id)

      if (foundMatch != null) {
        const index = this.cart.indexOf(foundMatch);
        if (this.cart[index].quantity === 1) { // if item object needs to be removed from the cart
          this.cart.splice(index, 1) // save new copy of cart with object removed

        } else {
          this.cart[index].quantity--;
        }
      } else {
        console.log("ERROR, ATTEMTPING TO REMOVE ITEM NOT FOUND IN CART");
        console.log("activity being removed - " + activity);
        console.log("cart:");
        console.log(this.cart);
      }

      this.totalCartPrice -= activity.price;
      this.cartItemCount--;
    },

    //checkout button
    placeOrder(fullName, phoneNumber) {
      const checkoutDTO = window.checkoutDTO(this.cart, this.customer.name, this.customer.phoneNumber, this.customer.cardNumber);

      //TODO: SEND TO BACKEND ENDPOINT HERE
      console.log(checkoutDTO);

      API_POST('checkout', checkoutDTO);
    },

    // calendar functions
    printDateHeader() {
      // from chatGPT because honestly making this calendar is getting boring
      const monthName = new Date(this.displayedYear, this.displayedMonth)
        .toLocaleString('default', { month: 'long' });
      return `${monthName} ${this.displayedYear}`;
    },

    incrementCalendar() {
      if (this.displayedMonth === 11) {
        this.displayedYear++;
        this.displayedMonth = 0;
      } else {
        this.displayedMonth++;
      }
    },
    decrementCalendar() {
      if (this.displayedMonth === 0) {
        this.displayedYear--;
        this.displayedMonth = 11;
      } else {
        this.displayedMonth--;
      }
    },



    // specific event listeners
    // for dropdownMenu
    handleClickOutside(event) {
      const cartContainer = this.$el.querySelector(".cart-container");
      if (cartContainer && !cartContainer.contains(event.target)) {
        this.showCartDropdown = false;
      }
    },
    mounted() {
      document.addEventListener("click", this.handleClickOutside);
    },
    unmounted() {
      document.removeEventListener("click", this.handleClickOutside);
    }

  },

  computed: {
    // returns sorted array of activities
    sortedActivities() {
      const items = this.activities.slice();

      return items.sort((a, b) => {
        console.log("logging sorting function")
        switch (this.sortType) {
          case SORT_TYPES.EARLIEST_FIRST:
            console.log(a.time + " " + b.time)
            return a.date - b.date;
          case SORT_TYPES.EARLIEST_LAST:
            console.log(a.time + " " + b.time)
            return b.date - a.date;
          case SORT_TYPES.PRICE_ASCENDING:
            console.log(a.price + " " + b.price)
            return a.price - b.price;
          case SORT_TYPES.PRICE_DESCENDING:
            console.log(a.price + " " + b.price)
            return b.price - a.price;
          case SORT_TYPES.RATING_ASCENDING:
            console.log(a.rating + " " + b.rating)
            return a.rating - b.rating;
          case SORT_TYPES.RATING_DESCENDING:
            console.log(a.rating + " " + b.rating)
            return b.rating - a.rating;

          // TODO IMPLEMENT SLOT SORTING
        }
      }
      )
    },

    daysInMonth() { // returns array holding days populated with activities
      // sliding window approach

      // start and end dates acting as pointers
      const startDate = new Date(this.displayedYear, this.displayedMonth, 1);
      const endDate = new Date(this.displayedYear, this.displayedMonth + 1, 0);

      // array of days to be rendered and hold activities
      const days = [];

      // populate each day
      for (let d = 0; d < endDate.getDate(); d++) {
        // store individual date of day
        const dDate = new Date(this.displayedYear, this.displayedMonth, d);

        // store activities that happen on day
        const dActivities = this.activities.filter(a => {
          const activityDate = new Date(a.date);
          // if activity date matches dayDate return it (passes the filter)
          return activityDate.toDateString() === dDate.toDateString();
        });

        // push day object to array
        days.push({ date: dDate, activities: dActivities });
      }
      return days;
    },

    groupedDays() { // returns 2d array with days grouped by weekday

      // make bucket for each weekday
      const weekdays = Array.from( {length:7}, () => []);

      // fill into buckets
      this.daysInMonth.forEach(day => {
        // convert from sunday=0 (js version) to monday = 0
        const jsDay = day.date.getDay();
        const myDayIndex = (jsDay + 6) % 7;
      
        // day goes into bucket
        weekdays[myDayIndex].push(day);
      });
      return weekdays;
    }
    

  },
  watch: {
    cart: {
      handler(newVal, oldVal) {
        console.log("Cart updated")
        console.log("new cart:")
        console.log(newVal)
      },
      deep: true // makes handler show nested values
    },
    sortType: {
      handler(newval, oldval) {
        console.log("sortType updated")
        console.log(oldval + " -> " + newval)
      }
    }
  }
});

// expose as vm to manually check data when debuggin REMOVE THIS
window.vm = app.mount('#app');