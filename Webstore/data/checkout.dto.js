function checkoutDTO(cart, fullName, phoneNumber, cardNumber){
    let activityArray = [];
    cart.forEach(activity => {
        const id = activity.id;
        const quantity = activity.quantity;

        activityArray.push({
            _id:id,
            quantity: quantity
        });
    });

    let customerDetails = {
        customerName: fullName,
        phoneNumber: phoneNumber,
        cardNumber: cardNumber
    };

    return {
        activities: activityArray,
        customerDetails: customerDetails
    };
}

window.checkoutDTO = checkoutDTO;