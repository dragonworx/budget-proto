Payments = class extends Axial.Component {
	currency (num) {
		const fixed = num.toFixed(0);
		const split = fixed.split('.');
		return split[1] === '00' ? split[0] : fixed;
	}

	startPaymentRender () {
		this.paymentPos = [];
	}

	registerDebt (debt) {
		const id = debt.ref.id;
		const paymentPos = this.paymentPos;
		if (paymentPos.length === 0) {
			paymentPos.push(id);
		} else if (debt.type.match(/head|whole/)) {
			for (let i = 0; i <= paymentPos.length; i++) {
				if (typeof paymentPos[i] === 'undefined') {
					paymentPos[i] = id;
					break;
				}
			}
		}
	}

	unregisterDebt (debt) {
		const id = debt.ref.id;
		const paymentPos = this.paymentPos;
		if (debt.type.match(/tail|whole/)) {
			const index = paymentPos.indexOf(id);
			delete paymentPos[index];
		}
	}

	layoutPayments (payments) {
		// reset current layout stack
		this.startPaymentRender();

		// layout payments
		const paymentLayout = {};
		payments.forEach(payment => {
			// register onto current layout stack
			payment.debts.forEach(debt => {
				this.registerDebt(debt);
			});
			// create copy of current layout stack
			const copy = [];
			copy.push.apply(copy, this.paymentPos);
			const key = this.dateStr(payment.paymentDate);
			paymentLayout[key] = copy;
			// unregister after copying current layout stack
			payment.debts.forEach(debt => {
				this.unregisterDebt(debt);
			});
		});

		// finalise payment layout
		const _paymentLayout = {};
		payments.forEach(payment => {
			const dateKey = this.dateStr(payment.paymentDate);
			const layout = paymentLayout[dateKey];
			_paymentLayout[dateKey] = layout.map(id => payment.debts.find(debt => debt.ref.id === id));
		});

		return _paymentLayout;
	}

	onKeyUp (e, payment) {
		if (e.keyCode === 13) {
			const amount = parseFloat(e.target.value);
			this.setCustomLimit(payment.paymentDate, amount);
			this.set('hoverAmount');
		} else if (e.keyCode === 27) {
			this.setCustomLimit(payment.paymentDate, null);
			this.set('hoverAmount');
		}
	}

	render () {
		const payments = this.getPayments();
		const layout = this.layoutPayments(payments);
		const today = new XDate();
		const isSelected = payment => today >= payment.weekStartDate && today <= payment.weekEndDate ? 'selected' : ''

		// create stream cells
		const streams = payments.map(payment => <td className="streams">{
			layout[this.dateStr(payment.paymentDate)].reverse().map(debtRef => {
				return typeof debtRef === 'undefined' ? <div className="stream empty"></div> : (
				<div className={`stream ${debtRef.type} ${this.isHover(debtRef.ref) ? 'hover' : ''} ${debtRef.status}`} 
					onMouseOver={() => this.set('hover', debtRef.ref)} 
					onDoubleClick={() => this.onDblClicked(debtRef.ref)}
					id={debtRef.type.match(/head|whole/) ? `debt-${debtRef.ref.id}` : null}
				>
						<div className="title">{debtRef.type.match(/head|whole/) ? debtRef.ref.title : ''}</div>
						<div className="balance"><span className="from">${this.currency(debtRef.fromBalance)}</span><span className="portion">${this.currency(debtRef.portion)}</span><span className="to">${this.currency(debtRef.toBalance)}</span></div>
					</div>
				);
			})
		}</td>);

		// create week cells
		let currentMonth;
		const weekCss = payment => payment.paymentDate.getMonth() % 2 === 0 ? 'alt' : 'normal';
		const todayStartWeek = this.getDateFromKey(this.getKeyFromDate(new XDate())).date;
		const weeks = payments.map(payment => {
			return (
				<td className={`week ${weekCss(payment)} ${isSelected(payment)} ${payment.debts.find(debt => debt.status === 'expired') ? 'expired' : ''}`}>
					<div className={`amount ${this.hasCustomLimit(payment.paymentDate) ? 'custom' : ''}`} 
						onMouseOver={() => this.set('hoverAmount', this.dateStr(payment.paymentDate))}>
						{
							this.$.hoverAmount === this.dateStr(payment.paymentDate) 
								? <input type="text" defaultValue={this.currency(this.getPaymentAmount(payment, true))} 
										onKeyUp={e => this.onKeyUp(e, payment)} 
										onMouseOver={e => e.target.select()} 
										onMouseOut={() => this.set('hoverAmount')} /> 
								: null
						}
						${this.currency(this.getPaymentAmount(payment))}
					</div>
					<div className="date">{this.dateStr(payment.paymentDate)}</div>
					<div className="month">{payment.paymentDate.getMonth() !== currentMonth ? (currentMonth = payment.paymentDate.getMonth(), `${payment.paymentDate.toString('MMM')} ${payment.paymentDate.getFullYear()}`) : ''}</div>
					<div className="progressOuter"><div className="progressInner" style={{width:this.getProgress(payment)}}></div></div>
					<div className="totalDebtUsed">
						${this.currency(this.getTotalDebt(payment))}
						<input type="checkbox" defaultChecked={this.getPaymentCheck(payment.weekStartDate)} onChange={e => this.setPaymentCheck(payment.weekStartDate, e.target.checked)} />
					</div>
					<div className={`totalDebtRemaining ${this.getTotalCredit(payment) < 0 ? 'exceeded' : ''}`}>${this.currency(this.getTotalCredit(payment))}</div>
				</td>
			);
		});

		return (
			<div className="payments">
				<table cellSpacing="0" cellPadding="0">
					<tr>{streams}</tr>
					<tr>{weeks}</tr>
				</table>
			</div>
		);
	}
};
