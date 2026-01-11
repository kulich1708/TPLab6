export function parseRequest(request: { [key: string]: any }): any[] {
	const userId = request.userId;
	const items = request.items;
	const coupon = request.coupon;
	const currency = request.currency;
	return [userId, items, coupon, currency];
}
export function processCheckout(request: { [key: string]: any }): { [key: string]: any } {
	let [userId, items, coupon, currency] = parseRequest(request);

	if (userId === undefined)
		throw new Error('userId is required');
	if (items === undefined)
		throw new Error('items is required');
	if (currency === undefined)
		currency = 'USD';

	if (!Array.isArray(items))
		throw new Error('items must be a list');
	if (items.length === 0)
		throw new Error('items must not be empty');

	for (const item of items) {
		if (item.price === undefined || item.qty === undefined)
			throw new Error('item must have price and qty');
		if (item.price <= 0)
			throw new Error('price must be positive');
		if (item.qty <= 0)
			throw new Error('qty must be positive');
	}
	let subtotal = 0;
	for (const item of items)
		subtotal = subtotal + item.price * item.qty;

	let discount = 0;
	if (coupon === undefined || coupon === null || coupon === '')
		discount = 0;
	else if (coupon === 'SAVE10')
		discount = subtotal * 0.1
	else if (coupon === 'SAVE20') {
		if (subtotal >= 200)
			discount = subtotal * 0.2;
		else
			discount = subtotal * 0.05;
	}
	else if (coupon === 'VIP') {
		discount = 50
		if (subtotal < 100)
			discount = 10;
	}
	else
		throw new Error('unknown coupon');

	let totalAfterDiscount = subtotal - discount;
	if (totalAfterDiscount < 0)
		totalAfterDiscount = 0;

	const tax = totalAfterDiscount * 0.21;
	const total = totalAfterDiscount + tax;

	const orderId = userId.toString() + '-' + items.length.toString() + '-' + 'X';

	return {
		orderId: orderId,
		userId: userId,
		currency: currency,
		subtotal: subtotal,
		discount: discount,
		tax: tax,
		total: total,
		itemsCount: items.length,
	}
}