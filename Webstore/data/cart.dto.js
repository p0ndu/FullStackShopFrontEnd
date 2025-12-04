function makeNewCartDTO (_id, name, price){
    return {
        _id: _id,
        name: name,
        price: price,
        quantity: 1
    };
};

window.cartDTO = makeNewCartDTO;