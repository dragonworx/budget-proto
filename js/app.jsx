const testAxis1 = window.testAxis1 = {state:{foo:'abc'}};
const testAxis2 = window.testAxis2 = {state:{foo:'abc'}};

TestAxialByProps = class extends Axial.Component {
	render () {
		return (
			<div>
				test {this.$.foo}
				<button onClick={() => this.set('foo', 'efg')}>click</button>
			</div>
		);
	}
};

TestAxialByConstructor = class extends Axial.Component {
	constructor (props) {
		super(props);
		this.setAxis(testAxis2);
	}

	render () {
		return (
			<div>
				<span>test {this.$.foo}</span>
				<button onClick={() => this.set('foo', 'efg')}>click</button>
			</div>
		);
	}
};

/*
<TestAxialByProps axis={testAxis1} />
<TestAxialByConstructor />
<TestAxialByConstructor />
*/

BudgetApp = class extends Axial.Component {
	render () {
		return (
			<div className="app">
				<Settings />
				<Debts />
				<Payments />
			</div>
		);
	}
};