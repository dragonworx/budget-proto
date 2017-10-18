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
      <div id="logo" style={{display:this.isEdit() ? 'none': 'block'}}>{`v${this.$.version}`}<a title="Current profile, click to use different profile" className="profile" onClick={() => this.selectProfile()}>{this.getProfile()}</a></div>
				<label>Spend: <a title="The maximum default to allocate each week for repayments">
          <b>$</b><input type="text" className="limit" defaultValue={this.$.weeklyLimit} onKeyUp={e => this.onKeyUp(e, 'weeklyLimit')} onMouseOver={this.onMouseOver} onMouseOut={e => this.onMouseOut(e, 'weeklyLimit')} /></a></label>
        <label>On: <a title="The day of the week to make repayments"><select defaultValue={this.$.weekPaymentDay} onChange={e => this.set('weekPaymentDay', parseFloat(e.target.value))}>
          <option value="0">Sun</option>
          <option value="1">Mon</option>
          <option value="2">Tue</option>
          <option value="3">Wed</option>
          <option value="4">Thu</option>
          <option value="5">Fri</option>
          <option value="6">Sat</option>
        </select></a></label>
        <label>
          Max Weeks:&nbsp;
          <a title="The maximum number of weeks to allow a repayment to occur before a visual warning">
          <input type="text" defaultValue={this.$.maxWeekTolerance} onKeyUp={e => this.onKeyUp(e, 'maxWeekTolerance')} onMouseOver={this.onMouseOver} onMouseOut={e => this.onMouseOut(e, 'maxWeekTolerance')} />
          </a>
        </label>
        <label>
          Max Credit:&nbsp;
          <a title="The maximum available credit used for down payments, weeks will provide a visual warning if it goes below">
          <input type="text" defaultValue={this.$.maxDebtTolerance} onKeyUp={e => this.onKeyUp(e, 'maxDebtTolerance')} onMouseOver={this.onMouseOver} onMouseOut={e => this.onMouseOut(e, 'maxDebtTolerance')} />
          </a>
        </label>
        <img className="add" src="img/add.png" onClick={() => this.addDebt()} title="add a debt (+ key)" />
        <img className="save" src={`img/${this.$.modified ? 'modified' : this.$.saved ? 'save-ok' : 'save'}.png`} onClick={() => this.save()} title="save current data" />
        <img className="clear" src="img/clear.png" onClick={() => this.clear()} title="clear current data (does not save)" />
        <img className="import" src="img/import.png" onClick={() => this.import()} title="import current data" />
        <img className="export" src="img/export.png" onClick={() => this.export()} title="export current data" />
        <div className="disable" style={{display:this.isEdit() ? 'block': 'none'}}></div>
			</div>
		);
	}
};