function newGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const app = {
	defaultData () {
		return {
			version: '1.2.0',
			weeklyLimit: 200,
			weekPaymentDay: 4,
			maxWeekTolerance: 7,
			maxDebtTolerance: 6000,
			debts: [],
			hover: null,
			edit: null,
			saved: false,
			modified: false,
			hoverAmount: null,
			customLimits: {},
			paymentChecks: {},
			hoverOverride: null,
			customOverrides: {}
		}
	},

	init () {
		this.$ = this.defaultData();
		this.load();
		setTimeout(() => {
			if (this.$.debts.length > 0) {
				const selected = document.querySelector('td.selected');
				if (selected) {
					selected.scrollIntoView({behavior:'smooth'});
				}
			}
		}, 100);
		window.addEventListener('keyup', e => {
			if (!this.$.edit && (e.keyCode === 107 || e.keyCode === 187)) {
				this.addDebt();
			}
		});
		this.io = document.querySelector('#io');
	},

	pad (num) {
		let str = '' + num;
		return str.length === 1 ? '0' + str : str;
	},

	isHover (debt) {
		return this.$.hover && this.$.hover === debt;
	},

	isEdit (debt) {
		if (arguments.length === 0) {
			return !!this.$.edit;``
		}
		return this.$.edit && this.$.edit === debt;
	},

	setIsEnabled (debt, value) {
		debt.enabled = value;
		// weird behavior from checkboxes, other things dont need async delay
		setTimeout(() => this.modify(), 0);
	},

	addDebt () {
		this.$.hover = null;
		if (arguments.length === 0) {
			const id = this.newGuid();
			const debt = {
				id: id,
				title: 'New Expense',
				amount: 0,
				payed: new XDate(),
				enabled: true
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

	clear () {
		const data = this.defaultData();
		this.$ = data;
		this.modify();
	},

	selectProfile () {
		const profile = prompt('Enter profile name:');
		if (profile) {
			this.setProfile(profile);
		}
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

	newGuid () {
		const guid = newGuid();
		if (this.$.debts.find(debt => debt.id === guid)) {
			return this.guid;
		}
		return guid;
	},

	getData () {
		return  {
			version: this.$.version,
			customLimits: this.$.customLimits,
			debts: this.$.debts,
			maxDebtTolerance: this.$.maxDebtTolerance,
			maxWeekTolerance: this.$.maxWeekTolerance,
			paymentChecks: this.$.paymentChecks,
			weekPaymentDay: this.$.weekPaymentDay,
			weeklyLimit: this.$.weeklyLimit
		};
	},

	setData (data) {
		data.debts.forEach(debt => debt.payed = new XDate(XDate.parse(debt.payed)));
		this.$ = this.defaultData();
		this.set({
			customLimits: data.customLimits,
			debts: data.debts,
			maxDebtTolerance: data.maxDebtTolerance,
			maxWeekTolerance: data.maxWeekTolerance,
			paymentChecks: data.paymentChecks,
			weekPaymentDay: data.weekPaymentDay,
			weeklyLimit: data.weeklyLimit
		});
		this.modify();
	},

	export () {
		const json = JSON.stringify(this.getData());
		this.io.value = json;
		this.io.style.display = 'block';
	},

	import () {
		this.io.style.display = 'block';
		this.io.addEventListener('keyup', e => {
			if (e.keyCode === 13) {
				const json = JSON.parse(this.io.value.trim());
				this.setData(json);
				this.save(true);
				window.location.reload();
			}
		});
	},

	save (silent) {
		if (silent !== true) {
			this.set({
				edit: null,
				hover: null,
				hoverAmount: null,
				hoverOverride: null
			});
		}
		this.$.saved = false;
		this.$.modified = false;
		localStorage[`budget-proto-${this.getProfile()}`] = JSON.stringify(this.getData());
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
			this.setData(JSON.parse(data));
		}
	},

	modify () {
		setTimeout(() => this.set(() => this.$.modified = true), 0);
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

	setCustomOverride (date, amount) {
		if (amount === null) {
			delete this.$.customOverrides[this.dateStr(date)];
		} else {
			this.$.customOverrides[this.dateStr(date)] = amount;
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
			if (!debt.enabled) {
				return;
			}
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
	
	getSortedDebts (showAll) {
		const debts = this.$.debts.filter(debt => showAll === true || debt.enabled);
		return debts.sort((a, b) => {
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
		const payments = [];
		const durations = {};

		const debtsByWeek = this.debtsByWeek();
		const sortedDebts = this.getSortedDebts();

		if (sortedDebts.length === 0) {
			return [];
		}

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
		let customLimit = 0;

		while (debts.length > 0 || dateIndex <= endDate) {
			// for each WEEK, add existing debts for week onto stack
			weekIndex++;

			// get debts for this week key
			const key = this.getKeyFromDate(dateIndex, true);
			const debtsThisWeek = debtsByWeek[key];

			if (debtsThisWeek) {
				debts.push.apply(debts, debtsThisWeek.map(debt => {
					// create debt for week
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

			// get available credit to spend for week
			if (this.hasCustomLimit(paymentDate)) {
				customLimit = this.getCustomLimit(paymentDate);
			}
			let limit = customLimit ? customLimit : app.$.weeklyLimit;

			// pay debts using limit for that week
			this.payDebts(debts, limit);

			// tally total amount
			let paymentAmount = 0;
			debts.forEach(debt => {
				paymentAmount += debt.portion;
			});

			// create payment detail for week
			const payment = {
				debts: debts.map(debt => {
					// 1. initialise running debts for week
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

					// create a payment
					return {
						status: status,
						portion: debt.portion,
						fromBalance: debt.previousBalance,
						toBalance: toBalance,
						ref: debt.ref,
						type: type === 'head' && toBalance === 0 ? 'head whole' : type
					};
				}).sort((a, b) => {
					// 2. sort by payed date
					return a.ref.payed < b.ref.payed;
				}),
				// payment properties
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

			// remove resolved debts from running debts
			debts = debts.filter(debt => debt.balance > 0);

			// increment by one week, calculate next week...
			dateIndex.addWeeks(1);
		}

		// finished, return payments
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

	getTotalWeekStartDebt (payment) {
		// use an override if found
		const override = this.$.customOverrides[this.dateStr(payment.weekStartDate)];
		if (!isNaN(override)) {
			return override;
		}

		// otherwise return sum of running debt from balances
		let total = 0;
		payment.debts.forEach(debt => total += debt.fromBalance);
		return total;
	},

	getTotalWeekEndDebt (payment) {
		let runningFromBalance = 0;
		payment.debts.forEach(debt => runningFromBalance += debt.fromBalance);

		// TODO: should we just find normal delta between end and start, then add to getTotalWeekStartDebt()
		let runningToBalance = 0;
		payment.debts.forEach(debt => runningToBalance += debt.toBalance);
		
		let weekEndAmount = runningToBalance;

		const override = this.$.customOverrides[this.dateStr(payment.weekStartDate)];
		if (!isNaN(override)) {
			weekEndAmount = runningToBalance + (override - runningFromBalance);
		}

		return weekEndAmount;
	},

	getTotalWeekStartCredit (payment) {
		return this.$.maxDebtTolerance - this.getTotalWeekStartDebt(payment);
	},

	getTotalWeekEndCredit (payment) {
		return this.$.maxDebtTolerance - this.getTotalWeekEndDebt(payment);
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
	document.querySelector('.app').classList.add('error');
}

/*
TODO:
- convert data layer to db, deploy prototype to server
*/