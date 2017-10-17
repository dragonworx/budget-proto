const app = {
	$: {
		weeklyLimit: 200,
		weekPaymentDay: 4,
		maxWeekTolerance: 7,
		maxDebtTolerance: 6000,
		debtId: 0,
		debts: [],
		hover: null,
		edit: null,
		saved: false,
		modified: false,
		hoverAmount: null,
		customLimits: {},
		paymentChecks: {}
	},

	pad (num) {
		let str = '' + num;
		return str.length === 1 ? '0' + str : str;
	},

	isHover (debt) {
		return this.$.hover && this.$.hover === debt;
	},

	isEdit (debt) {
		return this.$.edit && this.$.edit === debt;
	},

	addDebt () {
		if (arguments.length === 0) {
			this.$.debtId = this.$.debtId + 1;
			const id = this.$.debtId;
			const debt = {
				id: id,
				title: `Expense ${id}`,
				amount: 0,
				payed: new XDate()
			};
			this.$.debts.push(debt);
			this.set('edit', debt);
		} else {
			this.$.debts.push.apply(this.$.debts, arguments);
		}
		this.modify();
	},

	removeDebt (debt) {
		const index = this.$.debts.indexOf(debt);
		this.$.debts.splice(index, 1);
		delete this.$.hover;
		this.set();
		this.modify();
	},

	init () {
		this.load();
		setTimeout(() => {
			if (this.$.debts.length > 0) {
				const selected = document.querySelector('td.selected');
				if (selected) {
					selected.scrollIntoView({behavior:'smooth'});
				}
			}
		}, 100);
	},

	clear () {
		this.set('debts', []);
		this.modify();
	},

	setProfile (profile) {
		localStorage['budget-proto-profile'] = profile;
		window.location.reload();
	},

	saveProfile (profile) {
		localStorage['budget-proto-profile'] = profile;
		this.save();
		window.location.reload();
	},

	getProfile () {
		return localStorage['budget-proto-profile'] ? localStorage['budget-proto-profile'] : 'default';
	},

	save (silent) {
		if (silent !== true) {
			this.set({
				edit: null,
				hover: null,
				hoverAmount: null
			});
		}
		this.$.saved = false;
		this.$.modified = false;
		localStorage[`budget-proto-${this.getProfile()}`] = JSON.stringify(this.$);
		if (silent !== true) {
			this.set({
				saved: true,
				modified: false
			});
		}
	},

	load () {
		const data = localStorage[`budget-proto-${this.getProfile()}`];
		if (data) {
			this.$ = JSON.parse(data);
		}
		this.$.debts.forEach(debt => debt.payed = new XDate(XDate.parse(debt.payed)));
	},

	modify () {
		this.$.modified = true;
	},

	dateStr (date) {
		return date.toString('dd/MM/yy')
	},

	hasCustomLimit (date) {
		return !!this.getCustomLimit(date);
	},

	hasPaymentCheck (date) {
		return this.$.paymentChecks.hasOwnProperty(this.dateStr(date));
	},

	getPaymentCheck (date) {
		return !!this.$.paymentChecks[this.dateStr(date)];
	},

	setPaymentCheck (date, value) {
		this.$.paymentChecks[this.dateStr(date)] = value;
		this.modify();
	},

	setCustomLimit (date, amount) {
		if (amount === null) {
			delete this.$.customLimits[this.dateStr(date)];
		} else {
			this.$.customLimits[this.dateStr(date)] = amount;
		}
		this.modify();
	},

	getCustomLimit (date) {
		return this.$.customLimits[this.dateStr(date)];
	},

	getProgress (payment) {
		const today = new XDate();
		const progress = Math.min(100, (today.getDay() / this.$.weekPaymentDay) * 100);
		return `${progress}%`;
	},

	debtsByWeek () {
		let payments = {};
		this.getSortedDebts().forEach(debt => {
			const key = this.getKeyFromDate(debt.payed, true);
			if (!payments[key]) {
				payments[key] = [];
			}
			payments[key].push(debt);
		});
		return payments;
	},

	getKeyFromDate (date, snapToNextPaymentDate = false) {
		if (snapToNextPaymentDate) {
			return this.getKeyFromDate(this.getNextPaymentDate(date));
		}
		let year = date.getFullYear();
		let month = date.getMonth();
		let weekInMonth = this.getWeekInMonth(date);
		const key = `${year}:${this.pad(month)}:${this.pad(weekInMonth)}`;
		return key;
	},

	getDateFromKey (key) {
		const fields = key.split(':');
		const year = parseInt(fields[0], 10);
		const month = parseInt(fields[1], 10);
		const weekInMonth = parseInt(fields[2], 10);
		const date = new XDate(year, month, 1);
		let week = 1;
		while (week < weekInMonth) {
			if (date.getDay() === 6) {
				week++;
			}
			date.addDays(1);
		}
		return {
			year: year,
			month: month,
			weekInMonth: weekInMonth,
			date: date
		};
	},

	getWeekInMonth (date) {
		const dayOfMonth = date.getDate();
		let startOfMonth = new XDate(date.getFullYear(), date.getMonth(), 1);
		let dayOfWeek = startOfMonth.getDay();
		let week = 1;
		for (let i = 1; i < dayOfMonth; i++) {
			dayOfWeek++;
			if (dayOfWeek === 7) {
				dayOfWeek = 0;
				week++;
			}
		}
		return week;
	},
	
	getSortedDebts () {
		return this.$.debts.sort((a, b) => {
			if (a.payed.getTime() === b.payed.getTime()) {
				return 0;
			} else if (a.payed.getTime() > b.payed.getTime()) {
				return 1;
			} else {
				return -1;
			}
		});
	},

	getNextPaymentDate (date) {
		const paymentDate = date.clone();
		while (paymentDate.getDay() != app.$.weekPaymentDay) {
			paymentDate.addDays(1);
		}
		return paymentDate;
	},

	getPayments () {
		if (this.$.debts.length === 0) {
			return [];
		}

		const payments = [];
		const durations = {};

		const debtsByWeek = this.debtsByWeek();
		const sortedDebts = this.getSortedDebts();

		let startWeekKey;
		let endDateKey = this.getKeyFromDate(sortedDebts[sortedDebts.length - 1].payed, true);
		let endDate = this.getDateFromKey(endDateKey).date

		let debts = [];
		for (let key in debtsByWeek) {
			if (!startWeekKey) {
				startWeekKey = key;
				break;
			}
		}

		let startWeek = this.getDateFromKey(startWeekKey);
		let dateIndex = startWeek.date;
		const todayKey = this.getKeyFromDate(new XDate());
		const today = this.getDateFromKey(todayKey).date;
		if (dateIndex > today) {
			dateIndex = today;
		}

		let weekIndex = 0;
		while (debts.length > 0 || dateIndex <= endDate) {
			weekIndex++;
			// for each week, add existing debts for week onto stack
			const key = this.getKeyFromDate(dateIndex, true);
			const debtsThisWeek = debtsByWeek[key];
			if (debtsThisWeek) {
				debts.push.apply(debts, debtsThisWeek.map(debt => {
					return {
						balance: debt.amount,
						paymentAmount: 0,
						ref: debt
					}
				}));
			}

			// reset debt payment amounts
			debts.forEach(debt => {
				debt.portion = 0;
				debt.previousBalance = debt.balance;
				debt.paymentAmount = 0
			});

			// pay debts
			const paymentDate = this.getNextPaymentDate(dateIndex);
			const weekStartDate = dateIndex.clone();
			const weekEndDate = weekStartDate.clone().addWeeks(1);
			let limit = this.hasCustomLimit(paymentDate) ? this.getCustomLimit(paymentDate) : app.$.weeklyLimit;
			this.payDebts(debts, limit);

			// tally amount
			let paymentAmount = 0;
			debts.forEach(debt => {
				paymentAmount += debt.portion;
			});

			// create payment
			const payment = {
				debts: debts.map(debt => {
					const toBalance = debt.balance > 0 ? debt.balance : 0;
					const type = debt.previousBalance === debt.ref.amount ? 'head' : toBalance <= 0 ? 'tail' : 'body';
					let status = paymentDate < today ? 'expired': 'active';
					if (!durations[debt.ref.id]) {
						durations[debt.ref.id] = 0;
					}
					durations[debt.ref.id]++;
					if (durations[debt.ref.id] > this.$.maxWeekTolerance) {
						status = 'warning';
					}
					return {
						status: status,
						portion: debt.portion,
						fromBalance: debt.previousBalance,
						toBalance: toBalance,
						ref: debt.ref,
						type: type === 'head' && toBalance === 0 ? 'head whole' : type
					};
				}).sort((a, b) => {
					return a.ref.payed < b.ref.payed;
				}),
				weekStartDate: weekStartDate,
				weekEndDate: weekEndDate,
				paymentDate: paymentDate,
				paymentAmount: paymentAmount,
				previousPayment: payments[payments.length - 1]
			};
			payments.push(payment);

			// register weekstart check state
			if (!this.hasPaymentCheck(weekStartDate)) {
				this.setPaymentCheck(weekStartDate, false);
			}

			// increment by one week, remove resolved debts
			debts = debts.filter(debt => debt.balance > 0);
			dateIndex.addWeeks(1);
		}

		return payments;
	},

	payDebts (debts, limit) {
		// divide available portion limit by debts
		const portion = Math.round(limit / debts.length);
		debts.forEach(debt => {
			debt.balance -= portion
			debt.portion += portion;
			if (debt.balance < 0) {
				// redistribute remainder on individual debt
				debt.portion = debt.previousBalance;
				const outstandingDebts = debts.filter(debt => debt.balance > 0);
				this.payDebts(outstandingDebts, Math.round(Math.abs(debt.balance) / outstandingDebts.length));
			}
		});

		// redistribute remainder from total limit
		let paymentAmount = 0;
		debts.forEach(debt => {
			paymentAmount += debt.portion;
		});
		if (debts.length > 0 && paymentAmount < limit) {
			const remainderAmount = limit - paymentAmount;
			const outstandingDebts = debts.filter(debt => debt.balance > 0);
			const remainderLimit = Math.round(remainderAmount / outstandingDebts.length);
			if (remainderLimit > 0) {
				this.payDebts(outstandingDebts, remainderLimit);
			}
		}
	},

	getPaymentAmount (payment, showCustomValue) {
		if (this.hasCustomLimit(payment.paymentDate)) {
			if (showCustomValue === true) {
				return this.getCustomLimit(payment.paymentDate);
			}
			if (payment.debts.length) {
				return payment.paymentAmount;
			}
			return this.getCustomLimit(payment.paymentDate);
		}
		return payment.paymentAmount;
	},

	getTotalDebt (payment) {
		let total = 0;
		payment.debts.forEach(debt => total += debt.toBalance);
		return total;
	},

	getTotalCredit (payment) {
		return this.$.maxDebtTolerance - this.getTotalDebt(payment);
	},

	getDurations (payments) {
		const occurences = {};
		payments.forEach(payment => {
			payment.debts.forEach(debt => {
				if (!occurences[debt.ref.id]) {
					occurences[debt.ref.id] = 0;
				}
				occurences[debt.ref.id]++;
			});
		});
		return occurences;
	},

	onAccept () {
		const debt = this.$.edit;
		const title = this.refs.title.getDOMNode().value;;
		const amount = parseFloat(this.refs.amount.getDOMNode().value);
		const date = this.refs.payed.getDOMNode().value.split('/');
		const day = parseFloat(date[0]);
		const month = parseFloat(date[1]) - 1;
		const year = parseFloat(date[2].length === 2 ? '20' + date[2] : date[2]);
		debt.title = title
		debt.amount = amount
		debt.payed = new XDate(year, month, day);
		this.set('edit');
		this.modify();
	},

	onCancel () {
		this.set('edit');
	},

	onDblClicked (debt) {
		this.set({
			edit: debt, 
			hover: undefined
		});
	}
};

// instance
Axial.setAxis(app);

window.onerror = function () {
	alert('An application error occurred, check console...');
}

/*
TODO:
- convert data layer to db, deploy prototype to server
*/