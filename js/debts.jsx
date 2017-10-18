Actions = class extends Axial.Component {
	render() {
		return (
			<div className="actions">
				{
					this.$.edit ? [
						<img src="img/accept.png" onClick={() => this.props.onAccept()} />,
						<img src="img/cancel.png" onClick={() => this.set('edit')} />
					] : [
							<img src="img/edit.png" onClick={() => this.set('edit', this.props.debt)} />,
							<img src="img/delete.png" onClick={() => this.removeDebt(this.props.debt)} />
						]
				}
			</div>
		);
	}
};

Debts = class extends Axial.Component {
	onKeyUp (e, isDate) {
		if (e.keyCode === 13) {
			this.onAccept();
		} else if (e.keyCode === 27) {
			this.onCancel();
		} else if (isDate) {
			let val = e.target.value.trim();
			if (val.length === 2 || val.length === 5 || val.length === 5) {
				val = val + '/';
				e.target.value = val;
			}
		}
	}

	render() {
		let isAltRow = true;
		const rowCss = () => { isAltRow = !isAltRow; return isAltRow ? 'alt' : 'normal' };
		return (
			<div className="debts">
				<table cellSpacing="0" cellPadding="0">
					<thead>
						<tr>
							<th>Title</th>
							<th>Amount</th>
							<th>Payed</th>
						</tr>
					</thead>
					<tbody>
						{
							this.getSortedDebts(true).map((debt, i) => {
								const cssClass = rowCss();
								return (
									<tr
										key={`debt${i}`}
										className={`${cssClass} ${this.isHover(debt) ? 'hover' : ''}`}
										onClick={() => debt.enabled && document.getElementById(`debt-${debt.id}`).scrollIntoView({behavior:'smooth'})}
										onMouseOver={() => !this.$.edit && debt.enabled && this.set('hover', debt)}
									>
										<td onDoubleClick={e => this.onDblClicked(debt)}><input type="checkbox" checked={debt.enabled} onChange={e => this.setIsEnabled(debt, e.target.checked)} />{this.isEdit(debt) ? <input type="text" ref="title" defaultValue={debt.title} onKeyUp={e => this.onKeyUp(e)} onMouseOver={e => e.target.focus() || e.target.select()} /> : debt.title}</td>
										<td onDoubleClick={e => this.onDblClicked(debt)}>${this.isEdit(debt) ? <input type="text" ref="amount" defaultValue={debt.amount} onKeyUp={e => this.onKeyUp(e)}  onMouseOver={e => e.target.focus() || e.target.select()}/> : debt.amount}</td>
										<td onDoubleClick={e => this.onDblClicked(debt)}>
											{this.isEdit(debt) ? <input type="text" ref="payed" defaultValue={debt.payed.toString('dd/MM/yy')} onKeyUp={e => this.onKeyUp(e, true)} onMouseOver={e => e.target.focus() || e.target.select()} /> : debt.payed.toString('dd/MM/yy')}
											{this.isEdit(debt) || this.isHover(debt) ? <Actions debt={debt} onAccept={() => this.onAccept()} /> : null}
										</td>
								</tr>
								)
							})
						}
					</tbody>
				</table>
			</div>
		)
	}
};
