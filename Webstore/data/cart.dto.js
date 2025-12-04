function makeNewCartDTO (_id, subject, price){
    return {
        _id: _id,
        subject: subject,
        price: price,
        quantity: 1
    };
};

window.cartDTO = makeNewCartDTO;