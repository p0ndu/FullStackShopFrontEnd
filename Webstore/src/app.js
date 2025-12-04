import { API_GET, API_POST } from "./api/client.js";
import { cache, cacheExpandedActivity } from "./cache.js";

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
      showOrderPopup: false,

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
      WEEKDAYS: window.WEEKDAYS,
      displayedMonth: today.getMonth(),
      displayedYear: today.getFullYear(),

      // error data for input validation on checkout
      errors: {
        name: "",
        phone: "",
        card: ""
      }
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

    async expandActivity(id) {
      this.hideAll();

      this.selectedActivity = await cacheExpandedActivity(id);
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

    openCheckoutPopup() {
      this.showOrderPopup = true;
    },
    closeCheckoutPopup() {
      this.hideAll;
      this.openShop();
      this.showOrderPopup = false;
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
      const foundMatch = this.cart.find(item => item._id === activity._id)

      if (foundMatch != null) {
        foundMatch.quantity++;
      } else {
        let cartDTO = window.cartDTO(activity._id, activity.name, activity.price);
        this.cart.push(cartDTO)
      }

      // the fact that I have to write it like this so stupid, fucking js man
      this.totalCartPrice = +this.totalCartPrice + +activity.price;
      this.cartItemCount++;
    },
    removeFromCart(activity) {
      // try find existing copy of activity in cart
      const foundMatch = this.cart.find(item => item._id === activity._id)

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
    placeOrder() {
      const isValid = this.validateUserDetails();

      if (!isValid) {
        return;
      }

      // build DTO and send to backend
      const checkoutDTO = window.checkoutDTO(
        this.cart,
        this.customer.name,
        this.customer.phoneNumber,
        this.customer.cardNumber
      );

      API_POST('checkout', checkoutDTO);
      // empty cart and show confirmation of order
      this.cart = [];
      this.cartItemCount = 0;
      this.openCheckoutPopup();
    },
    validateUserDetails() {
      this.errors.name = "";
      this.errors.phone = "";
      this.errors.card = "";

      // name validaiton 
      if (!this.customer.name || this.customer.name.trim().length < 2) {
        this.errors.name = "Please enter your full name.";
      } else if (!/^[A-Za-z ]+$/.test(this.customer.name)) {
        this.errors.name = "Name can only contain letters and spaces.";
      } else if (this.customer.name.trim().split(" ").length < 2) {
        this.errors.name = "Please enter a first and last name.";
      }

      // phone validation
      if (!/^[0-9]{10,15}$/.test(this.customer.phoneNumber)) {
        this.errors.phone = "Phone number must be 10–15 digits.";
      }

      // card validation
      if (!/^[0-9]{16}$/.test(this.customer.cardNumber)) {
        this.errors.card = "Card number must be 16 digits.";
      }

      if (this.errors.name || this.errors.phone || this.errors.card) {
        return false;
      }

      return true;
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

    // misc helper functions
    getDateInfo(activityDate) {
      const d = new Date(activityDate);
      const date = d.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const time = d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // build and return html snippet
      // felt like trying a html injection approach, mostly just for fun

      return `
        <div class = 'activityDateTimeContainer'>
        <span class='date'>${date}</span>
        <span class='time'>${time}</span>
        <p> Duration: ${this.selectedActivity.duration} minutes </p>
        </div>
      `;
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
      const items = Object.values(cache.activitySummaries);

      return items.sort((a, b) => {
        switch (this.sortType) {
          case SORT_TYPES.EARLIEST_FIRST:
            return new Date(a.date) - new Date(b.date);
          case SORT_TYPES.EARLIEST_LAST:
            return new Date(b.date) - new Date(a.date);
          case SORT_TYPES.PRICE_ASCENDING:
            return Number(a.price) - Number(b.price);
          case SORT_TYPES.PRICE_DESCENDING:
            return Number(b.price) - Number(a.price);
          case SORT_TYPES.RATING_ASCENDING:
            return Number(a.rating) - Number(b.rating);
          case SORT_TYPES.RATING_DESCENDING:
            return Number(b.rating) - Number(a.rating);
          case SORT_TYPES.SLOTS_ASCENDING:
            return Number(a.vacancies) - Number(b.vacancies);
          case SORT_TYPES.SLOTS_DESCENDING:
            return Number(b.vacancies) - Number(a.vacancies);
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
      const weekdays = Array.from({ length: 7 }, () => []);

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
    }
  }
});

// expose as vm to manually check data when debuggin REMOVE THIS
window.vm = app.mount('#app');