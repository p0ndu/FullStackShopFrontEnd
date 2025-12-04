function MakeCheckoutDTO(cart, fullName, phoneNumber, cardNumber){
    let activityArray = [];
    cart.forEach(activity => {
        const _id = activity._id;
        const quantity = activity.quantity;

        activityArray.push({
            _id:_id,
            quantity: quantity
        });
    });

    let customerDetails = {
        customerName: fullName,
        phoneNumber: phoneNumber,
        cardNumber: cardNumber
    };

    return {
        activityArray: activityArray,
        customerDetails: customerDetails
    };
}

window.checkoutDTO = MakeCheckoutDTO;