let mock = {portfolios:
    [
        {
            name: "Test 1",
            currency: "usd",
            stocks: [ /*
                {
                    name: "MSFT",
                    quantity: 5
                },

                {
                    name: "NOK",
                    quantity: 10
                } */
            ]
        },

        {
            name: "Test 2",
            currency: "usd",
            stocks: [

            ]
        },

        {
            name: "Test 3",
            currency: "usd",
            stocks: [

            ]
        }
    ]};

let apiKey = "6RV3I3M11BQK941F";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.onPortfolioAdd = this.onPortfolioAdd.bind(this);
        this.onPortfolioDelete = this.onPortfolioDelete.bind(this);
        this.onPortfolioUpdate = this.onPortfolioUpdate.bind(this);
        this.state = {portfolios: getPortfoliosFromStorage()};
    }

    render() {
        const portfolios = this.state.portfolios;
        const boxes = portfolios.map((portfolio) =>
            <Portfolio key={portfolio.name}
                       portfolio={portfolio}
                       onAdd={this.onPortfolioAdd}
                       onDelete={this.onPortfolioDelete}
                       onUpdate={this.onPortfolioUpdate}/>
        );
        const empty ={};

        return (
            <div>
                {boxes}
                <Portfolio key="empty" portfolio={empty} />
            </div>
        );
    }

    onPortfolioUpdate(portfolio) {
        const portfolios = setPortfolioInStorage(portfolio);
        this.setState({portfolios: portfolios});
    }

    onPortfolioAdd(portfolio) {
        const portfolios = setPortfolioInStorage(portfolio);
        this.setState({portfolios: portfolios});
    }

    onPortfolioDelete(portfolio) {
        console.log(portfolio);

        const portfolios = deletePortfolioInStorage(portfolio);
        this.setState({portfolios: portfolios});

        console.log(portfolios);
    }
}

class Portfolio extends React.Component {
    render() {
        const portfolio = this.props.portfolio;
        if (isEmpty(portfolio)) {
            return <EmptyPortfolio onAdd={this.props.onAdd}/>;
        } else {
            return <FilledPortfolio portfolio={portfolio}
                                    onDelete={this.props.onDelete}
                                    onUpdate={this.props.onUpdate}/>;
        }
    }
}

class FilledPortfolio extends React.Component {
    constructor(props) {
        super(props);
        this.onSumChange = this.onSumChange.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onAddSubmit = this.onAddSubmit.bind(this);
        this.state = {sum: 0, newEntry: {symbol: "", quantity: 0}};
    }

    render() {
        const portfolio = this.props.portfolio;
        const name = portfolio.name;
        const currency = portfolio.currency;
        const stocks = portfolio.stocks;
        const sum = this.state.sum;

        const iconStyle = {fontSize: "36px"};

        return (
            <div className="col-6">
                <div className="portfolio">
                    <h1>{name}</h1>
                    <i className="fa fa-times-circle closeIcon"
                       onClick={this.onDelete}
                       style={iconStyle}></i>
                    <StockTable stocks={stocks}
                                onSumChange={this.onSumChange}
                                onUpdate={this.onUpdate}
                                newEntry={this.state.newEntry}/>
                    <SumLine sum={sum} />
                    <SubmitLine onAdd={this.onAddSubmit} />
                </div>
            </div>
        );
    }

    onSumChange(price) {
        console.log("onSumChange execute");

        const sum = this.state.sum + price;
        this.setState({sum: sum});
    }

    onDelete() {
        const portfolio = this.props.portfolio;
        this.props.onDelete(portfolio);
    }

    onUpdate(newEntry) {
        this.setState({newEntry: newEntry});
    }

    onAddSubmit() {
        var portfolio = this.props.portfolio;
        var newEntry = this.state.newEntry;
        const symbol = newEntry.symbol;
        const quantity = parseInt(newEntry.quantity);

        if (symbol !== "" && !isNaN(quantity) && quantity > 0) {
            newEntry = {name: symbol, quantity: quantity};

            // Clear newEntry to create a new empty line.
            this.setState({newEntry: {symbol: "", quantity: 0}});

            portfolio.stocks.push(newEntry);
            this.props.onUpdate(portfolio);
        }
    }
}

class EmptyPortfolio extends React.Component {
    render() {
        return (
            <div className="col-6">
                <div className="portfolio">
                    <h1>New Portfolio</h1>
                </div>
            </div>
        );
    }
}

class StockTable extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const stocks = this.props.stocks;
        const rows = stocks.map((stock) =>
            <StockTableRow key={stock.name} stock={stock} addPrice={this.props.onSumChange} />
        );
        const newEntry = this.props.newEntry;

        return (
            <div className="tableWrapper">
                <table>
                    <tbody>
                        <tr>
                            <th>Name</th>
                            <th>Unit value</th>
                            <th>Quantity</th>
                            <th>Total value</th>
                        </tr>
                        {rows}
                        <EmptyStockTableRow symbol={newEntry.symbol}
                                            quantity={newEntry.quantity}
                                            onUpdate={this.props.onUpdate} />
                    </tbody>
                </table>
            </div>
        );
    }
}

class StockTableRow extends React.Component {
    constructor(props) {
        super(props);
        this.setPrice = this.setPrice.bind(this);
        this.state = {price: 0};
    }

    render() {
        const name = this.props.stock.name;
        const quantity = this.props.stock.quantity;
        const price = this.state.price;
        const total = quantity * price;

        return (
            <tr>
                <td>{name}</td>
                <td>{price} $</td>
                <td>{quantity}</td>
                <td>{total} $</td>
            </tr>
        );
    }

    componentDidMount() {
        const name = this.props.stock.name;
        var method = "GET",
            url = "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" + name + "&apikey=" + apiKey,
            dataType = "json";

        $.ajax({
            method: method,
            url: url,
            dataType: dataType,
            success: this.setPrice
        });
    }

    setPrice(data) {
        // Catch notes in case of overusing API.
        if (data["Note"])
            return;

        const quote = data["Global Quote"];

        // Catch invalid stock name.
        if (isEmpty(quote))
            return;

        const price = quote["05. price"];
        const quantity = this.props.stock.quantity;
        this.setState({price: price});

        console.log("addPrice call.");
        this.props.addPrice(price * quantity);
    }
}

class EmptyStockTableRow extends React.Component {
    constructor(props) {
        super(props);
        this.onSymbolChange = this.onSymbolChange.bind(this);
        this.onQuantityChange = this.onQuantityChange.bind(this);
    }

    render() {
        const symbol = this.props.symbol;
        const quantity = this.props.quantity;

        return (
            <tr>
                <td><input type="text"
                           value={symbol}
                           onChange={this.onSymbolChange}
                           placeholder="New symbol" /></td>
                <td></td>
                <td><input type="number" value={quantity} onChange={this.onQuantityChange}/></td>
                <td></td>
            </tr>
        )
    }

    onSymbolChange(event) {
        const symbol = event.target.value;
        const quantity = this.props.quantity;
        const newEntry = {symbol: symbol, quantity: quantity};
        this.props.onUpdate(newEntry);
    }

    onQuantityChange(event) {
        const symbol = this.props.symbol;
        const quantity = event.target.value;

        const newEntry = {symbol: symbol, quantity: quantity};
        this.props.onUpdate(newEntry);
    }
}

class SumLine extends React.Component {
    render() {
        const sum = this.props.sum;

        return (
            <p>Total value of Portfolio: {sum} $</p>
        );
    }
}

class SubmitLine extends React.Component {
    render() {
        return (
            <div>
                <button onClick={this.props.onAdd}>Add stock</button>
                <button>Remove selected</button>
                <button>Show graph</button>
            </div>
        )
    }
}

setPortfoliosInStorage(mock.portfolios);

const elem = (
    <App />
);

ReactDOM.render(
    elem,
    document.getElementById("reactRoot")
);

/**
 * Checks if an object is empty.
 */
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function onClickMock() {
    console.log("Close icon clicked.");
    return;
}