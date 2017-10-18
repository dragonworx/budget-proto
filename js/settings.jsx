Settings = class extends Axial.Component {
  onKeyUp (e, key) {
    if (e.keyCode === 13) {
      this.set(key, parseFloat(e.target.value));
      e.target.blur();
      this.modify();
    }
  }

  onMouseOver (e) {
    e.target.focus();
    e.target.select();
  }

  onMouseOut (e, key) {
    this.set(key, parseFloat(e.target.value));
    e.target.blur();
  }

	render() {
		return (
			<div className="settings">
      <div id="logo">{this.$.version}</div>
				<label>Spend: <b>$</b><input type="text" className="limit" defaultValue={this.$.weeklyLimit} onKeyUp={e => this.onKeyUp(e, 'weeklyLimit')} onMouseOver={this.onMouseOver} onMouseOut={e => this.onMouseOut(e, 'weeklyLimit')} /></label>
        <label>On: <select defaultValue={this.$.weekPaymentDay} onChange={e => this.set('weekPaymentDay', parseFloat(e.target.value))}>
          <option value="0">Sun</option>
          <option value="1">Mon</option>
          <option value="2">Tue</option>
          <option value="3">Wed</option>
          <option value="4">Thu</option>
          <option value="5">Fri</option>
          <option value="6">Sat</option>
        </select></label>
        <label>
          Max Weeks:&nbsp;
          <input type="text" defaultValue={this.$.maxWeekTolerance} onKeyUp={e => this.onKeyUp(e, 'maxWeekTolerance')} onMouseOver={this.onMouseOver} onMouseOut={e => this.onMouseOut(e, 'maxWeekTolerance')} />
        </label>
        <label>
          Max Credit:&nbsp;
          <input type="text" defaultValue={this.$.maxDebtTolerance} onKeyUp={e => this.onKeyUp(e, 'maxDebtTolerance')} onMouseOver={this.onMouseOver} onMouseOut={e => this.onMouseOut(e, 'maxDebtTolerance')} />
        </label>
        <img className="add" src={`img/add.png`} onClick={() => this.addDebt()} title="add a debt" />
        <img className="save" src={`img/${this.$.modified ? 'modified' : this.$.saved ? 'save-ok' : 'save'}.png`} onClick={() => this.save()} title="save current data" />
        <img className="clear" src="img/clear.png" onClick={() => this.clear()} title="clear current data (does not save)" />
			</div>
		);
	}
};