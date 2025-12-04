import { API_GET, API_POST } from "./api/client.js";
import { cache, cacheExpandedActivity } from "./cache.js";

const app = Vue.createApp({
  data() {
    return {
      // general site data
      siteName: "Alexville Afterschool Activities",
      showShop: true,
      showCheckout: false,
      showDropdownCart: false,
      showOrderPopup: false,
      searchQuery: "",
      searchResults: [],

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
      this.showCheckout = false;
      this.showDropdownCart = false;
      this.showShop = false;
      this.selectedActivity = null;
      this.showOrderPopup = false;
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
    },


    // cart functions
    addToCart(activity) {
      // try find existing copy of activity in cart
      const foundMatch = this.findItemInCart(activity._id);

      if (foundMatch != null) {
        foundMatch.quantity++;
      } else {
        let cartDTO = window.cartDTO(activity._id, activity.subject, activity.price);
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

    // search functions
    debouncedSearch() {
      clearTimeout(this.searchTimeout);

      this.searchTimeout = setTimeout(() => {
        this.search();
      }, 300); // milliseconds delay
    },
    async search() {
      if (!this.searchQuery.trim()) {
        this.searchResults = [];
        return;
      }

      const res = await API_GET(`search?q=${this.searchQuery}`);
      this.searchResults = res.data;
    },

    // misc helper functions
    findItemInCart(id) {
      return this.cart.find(item => item._id === id);
    },
    canAddToCart(id) {
      const item = this.findItemInCart(id);
      const activity = cache.activitySummaries[id];
      let quantityInCart;

      if (item) {
        quantityInCart = item.quantity;
      } else {
        quantityInCart = 0;
      }

      return (quantityInCart + 1) <= activity.vacancies; // +1 because we are checking if we can add one more
    },
    quantityInCart(id) {
      const item = this.findItemInCart(id);
      if (item) {
        return item.quantity;
      }
      return 0;
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

    filteredActivities() {
      // If no search has been performed, show all activities
      if (this.searchResults.length === 0 || this.searchQuery.trim() === "") {
        return this.sortedActivities;
      }
      // otherwise return activities that match
      return this.sortedActivities.filter(a => this.searchResults.includes(a._id));
    },

    isCheckoutValid() {
      // clear previous errors
      this.errors.name = "";
      this.errors.phone = "";
      this.errors.card = "";

      let valid = true;

      // name validation
      if (!this.customer.name || this.customer.name.trim().length < 2) {
        this.errors.name = "Please enter your full name.";
        valid = false;
      } else if (!/^[A-Za-z ]+$/.test(this.customer.name)) {
        this.errors.name = "Name can only contain letters and spaces.";
        valid = false;
      } else if (this.customer.name.trim().split(" ").length < 2) {
        this.errors.name = "Please enter a first and last name.";
        valid = false;
      }

      // phone validation
      if (!/^[0-9]{10,15}$/.test(this.customer.phoneNumber)) {
        this.errors.phone = "Phone number must be 10–15 digits.";
        valid = false;
      }

      // card validation
      if (!/^[0-9]{16}$/.test(this.customer.cardNumber)) {
        this.errors.card = "Card number must be 16 digits.";
        valid = false;
      }

      return valid;
    }

  },

  watch: {
    cart: {
      handler(newVal) {
        console.log("Cart updated")
        console.log("new cart:")
        console.log(newVal)
      },
      deep: true // makes handler show nested values
    },
    searchQuery() {
      this.debouncedSearch(); // call search when query changes
    },
    searchResults: {
      handler(newVal) {
        console.log("Search results updated:")
        console.log(newVal)
      }
    }
  },
});

// expose as vm to manually check data when debuggin REMOVE THIS
window.vm = app.mount('#app');