export function validateOrder(order) {
    const errors = [];
    if (!order.cart || !Array.isArray(order.cart) || order.cart.length === 0) {
        errors.push('Cart is required and cannot be empty');
    }
    if (!order.customer) {
        errors.push('Customer name is required');
    }
    if (!order.address) {
        errors.push('Address is required');
    }
    if (!order.phone) {
        errors.push('Phone number is required');
    }
    return errors;
}

export function validateMenuItem(item) {
    const errors = [];
    if (!item.name) errors.push('Name is required');
    if (typeof item.price !== 'number' || item.price < 0) errors.push('Valid price is required');
    if (!item.category) errors.push('Category is required');
    return errors;
}
