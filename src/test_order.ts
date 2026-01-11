import { processCheckout } from './order_processing';

describe('Order Processing Tests (pytest style)', () => {
	test('test_ok_no_coupon', () => {
		const r = processCheckout({
			userId: 1,
			items: [{ price: 50, qty: 2 }],
			coupon: null,
			currency: "USD"
		});

		expect(r.subtotal).toBe(100);
		expect(r.discount).toBe(0);
		expect(r.tax).toBe(21);
		expect(r.total).toBe(121);
	});

	test('test_ok_save10', () => {
		const r = processCheckout({
			userId: 2,
			items: [{ price: 30, qty: 3 }],
			coupon: "SAVE10",
			currency: "USD"
		});

		expect(r.discount).toBe(9);
	});

	test('test_ok_save20', () => {
		const r = processCheckout({
			userId: 3,
			items: [{ price: 100, qty: 2 }],
			coupon: "SAVE20",
			currency: "USD"
		});

		expect(r.discount).toBe(40);
	});

	test('test_unknown_coupon', () => {
		expect(() => {
			processCheckout({
				userId: 1,
				items: [{ price: 10, qty: 1 }],
				coupon: "???",
				currency: "USD"
			});
		}).toThrow('unknown coupon');
	});
});