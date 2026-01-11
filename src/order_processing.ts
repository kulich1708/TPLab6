// Тип для конкретного товара в заказе
type ItemRequestType = {
	price: number,
	qty: number,
}
// Тип для запроса на создание заказа
type RequestType = {
	userId: number,
	items: ItemRequestType[],
	coupon?: string | null,
	currency?: CurrencyType,
}
// Тип для итогового заказа
type OrderType = {
	orderId: string,
	userId: number,
	currency: CurrencyType,
	subtotal: number,
	discount: number,
	tax: number,
	total: number,
	itemsCount: number,
}

const SUPPORTED_CURRENCIES = ['USD'] as const; // Массив всех валют
const COUPON_ERROR_MESSAGE = 'unknown coupon'; // Текст ошибки при неверном купоне
type CurrencyType = typeof SUPPORTED_CURRENCIES[number]; // Выводим тип на основе массива валют

// Конфиг со всеми нужными параметрами
const CONFIG = {
	COUPONS: {
		SAVE10: { rate: 0.1 } as const,
		SAVE20: { rate: 0.2, minRate: 0.05, minSubtotal: 200 } as const,
		VIP: { discount: 50, minDiscount: 10, minSubtotal: 100 } as const,
	} as const,
	TAX: { rate: 0.21 } as const,
	CURRENCY: { names: SUPPORTED_CURRENCIES, default: 'USD' as CurrencyType } as const
} as const

type CouponType = keyof typeof CONFIG.COUPONS | ''; // Выводим тип купонов из объекта

function validateItem(item: unknown): asserts item is ItemRequestType {
	if (item === null || typeof item !== 'object') {
		throw new Error("item must be an object");
	}

	const obj = item as Record<string, unknown>;

	if (!('price' in obj)) {
		throw new Error("item must have price");
	}
	if (!('qty' in obj)) {
		throw new Error("item must have qty");
	}

	if (typeof obj.price !== 'number') {
		throw new Error("price must be a number");
	}
	if (typeof obj.qty !== 'number') {
		throw new Error("qty must be a number");
	}

	if (obj.price <= 0) {
		throw new Error("price must be positive");
	}
	if (obj.qty <= 0) {
		throw new Error("qty must be positive");
	}
}

function validateRequest(data: unknown): asserts data is RequestType {
	if (data === null || typeof data !== 'object') {
		throw new Error("request must be an object");
	}

	const obj = data as Record<string, unknown>;

	// Проверка userId
	if (!('userId' in obj)) {
		throw new Error("user_id is required");
	}
	if (typeof obj.userId !== 'number') {
		throw new Error("user_id must be a number");
	}

	// Проверка items
	if (!('items' in obj)) {
		throw new Error("items is required");
	}
	if (!Array.isArray(obj.items)) {
		throw new Error("items must be a list");
	}

	const items = obj.items;
	if (items.length === 0) {
		throw new Error("items must not be empty");
	}

	// Проверка каждого элемента
	items.forEach(e => validateItem(e));
}



function calculateSubtotal(items: ItemRequestType[]): number {
	return items.reduce((subtotal, curr) => subtotal + curr.price * curr.qty, 0);
}
// Функция проверки входит ли текущий купон в тип CouponType
function isValidateCoupon(coupon?: string | null): coupon is (CouponType | undefined | null) {
	if (coupon === undefined || coupon === '' || coupon === null) return true;
	return Object.keys(CONFIG.COUPONS).includes(coupon);
}
function calculateDiscount(subtotal: number, coupon?: string | null): number {
	// На вход получаем купон как строку и сужаем её тип до CouponType и уже с этим типом запускаем функцию расчёта скидки
	if (!isValidateCoupon(coupon))
		throw new Error(COUPON_ERROR_MESSAGE);

	return calculateDiscountInternal(subtotal, coupon);
}
function calculateDiscountInternal(subtotal: number, coupon?: CouponType | null): number {
	if (coupon === undefined || coupon === '' || coupon === null) return 0;
	const coupons = CONFIG.COUPONS;
	switch (coupon) {
		case 'SAVE10':
			return subtotal * coupons.SAVE10.rate
		case 'SAVE20':
			const rate = subtotal >= coupons.SAVE20.minSubtotal ? coupons.SAVE20.rate : coupons.SAVE20.minRate;
			return subtotal * rate;
		case 'VIP':
			return subtotal < coupons.VIP.minSubtotal ? coupons.VIP.minDiscount : coupons.VIP.discount;
		default:
			// Если в тип CouponType добавится какой-то купон, который здесь мы не обрабатываем будет ошибка ts. Нужно для безопасности
			const exhaustiveCheck: never = coupon;
			throw new Error(COUPON_ERROR_MESSAGE);
	}
}
function calculateTotalAfterDiscount(subtotal: number, discount: number): number {
	let totalAfterDiscount = subtotal - discount;
	if (totalAfterDiscount < 0)
		totalAfterDiscount = 0;
	return totalAfterDiscount;
}
function calculateTax(totalAfterDiscount: number): number {
	return totalAfterDiscount * CONFIG.TAX.rate;
}
function generateOrderId(userId: number, items: ItemRequestType[]): string {
	return userId.toString() + '-' + items.length.toString() + '-' + 'X';
}
function processCheckoutInternal(request: RequestType): OrderType {
	let { userId, items, coupon, currency } = request;

	currency = currency === undefined ? CONFIG.CURRENCY.default : currency;
	const subtotal = calculateSubtotal(items);
	const discount = calculateDiscount(subtotal, coupon);
	const totalAfterDiscount = calculateTotalAfterDiscount(subtotal, discount);
	const tax = calculateTax(totalAfterDiscount);
	const total = totalAfterDiscount + tax;
	const orderId = generateOrderId(userId, items);

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
export function processCheckout(data: unknown): OrderType {
	validateRequest(data);
	return processCheckoutInternal(data);
}