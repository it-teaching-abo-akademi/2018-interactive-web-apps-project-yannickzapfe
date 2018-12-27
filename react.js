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
            currency: "eur",
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

// Key for the Alphavantage API.
const apiKey = "6RV3I3M11BQK941F";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.onPortfolioAdd = this.onPortfolioAdd.bind(this);
        this.onPortfolioDelete = this.onPortfolioDelete.bind(this);
        this.onPortfolioUpdate = this.onPortfolioUpdate.bind(this);
        this.createPopup = this.createPopup.bind(this);
        this.closePopup = this.closePopup.bind(this);
        this.state = {
            portfolios: getPortfoliosFromStorage(),
            exchangeRate: 1,
            popup: null,
            popupSelected: []
        };
        this.setExchangeRate();
    }

    render() {
        const portfolios = this.state.portfolios;
        const boxes = portfolios.map((portfolio) =>
            <Portfolio key={portfolio.name}
                       portfolio={portfolio}
                       exchangeRate={this.state.exchangeRate}
                       onAdd={this.onPortfolioAdd}
                       onDelete={this.onPortfolioDelete}
                       onUpdate={this.onPortfolioUpdate}
                       onShowGraph={this.createPopup} />
        );
        const empty = {};
        const popup = this.state.popup;

        return (
            <div>
                <Header />

                {boxes}
                {portfolios.length < 10 ?
                    <Portfolio key="empty"
                               portfolio={empty}
                               onAdd={this.onPortfolioAdd}
                               onDelete={this.onPortfolioDelete}
                               onUpdate={this.onPortfolioUpdate}
                               onShowGraph={this.createPopup} /> : <div></div>}
                {popup ? <GraphPopup portfolio={this.state.popup}
                                     close={this.closePopup}/> : <div></div>}
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
        const portfolios = deletePortfolioInStorage(portfolio);
        this.setState({portfolios: portfolios});
    }

    setExchangeRate() {
        const method = "GET";
        const url = "https://www.alphavantage.co/query?" +
            "function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey=" + apiKey;
        const dataType = "json";

        $.ajax({
            method: method,
            url: url,
            dataType: dataType,
            success: this.setExchangeRateFromData.bind(this)
        });
    }

    setExchangeRateFromData(data) {
        // Catch notes in case of overusing API.
        if (data["Note"])
            return;

        const exchangeRate = data["Realtime Currency Exchange Rate"]["5. Exchange Rate"];
        this.setState({exchangeRate: exchangeRate});
    }

    createPopup(portfolio, selected) {
        this.setState(currentState => {
            currentState.popup = portfolio;
            currentState.popupSelected = selected;
            return currentState;
        })
    }

    closePopup() {
        this.createPopup(null, []);
    }
}

class Header extends React.Component {
    render() {
        return (
            <div className="header">
                Stock Portfolio Management
            </div>
        );
    }
}

class Portfolio extends React.Component {
    render() {
        const portfolio = this.props.portfolio;
        if (isEmpty(portfolio)) {
            return <EmptyPortfolio onAdd={this.props.onAdd}/>;
        } else {
            return <FilledPortfolio portfolio={portfolio}
                                    exchangeRate={this.props.exchangeRate}
                                    onDelete={this.props.onDelete}
                                    onUpdate={this.props.onUpdate}
                                    onShowGraph={this.props.onShowGraph} />;
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
        this.onStockSelect = this.onStockSelect.bind(this);
        this.onStockRemove = this.onStockRemove.bind(this);
        this.onCurrencySwitch = this.onCurrencySwitch.bind(this);
        this.onShowGraph = this.onShowGraph.bind(this);
        this.state = {
            sum: 0,
            newEntry: {symbol: "", quantity: ""},
            selected: []
        };
    }

    render() {
        const portfolio = this.props.portfolio;
        const name = portfolio.name;

        const currency = portfolio.currency;
        const exchangeRate = this.props.exchangeRate;
        let sum = this.state.sum;

        if (currency === "eur") {
            sum *= exchangeRate;
        }

        const stocks = portfolio.stocks;

        const iconStyle = {fontSize: "40px"};

        return (
            <div className="col-6">
                <div className="portfolio">
                    <h1>{name}</h1>
                    <i className="fa fa-times-circle closeIcon"
                       onClick={this.onDelete}
                       style={iconStyle} />
                    <StockTable stocks={stocks}
                                currency={currency}
                                exchangeRate={this.props.exchangeRate}
                                onSumChange={this.onSumChange}
                                onUpdate={this.onUpdate}
                                newEntry={this.state.newEntry}
                                onRowSelect={this.onStockSelect}
                                selectedStocks={this.state.selected} />
                    <SumLine sum={sum} currency={currency} />
                    <SubmitLine onAdd={this.onAddSubmit}
                                onRemove={this.onStockRemove}
                                onCurrencySwitch={this.onCurrencySwitch}
                                currency={currency}
                                onShowGraph={this.onShowGraph} />
                </div>
            </div>
        );
    }

    onSumChange(price) {
        this.setState(currentState => {
            currentState.sum += price;
            return currentState;
        });
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
        newEntry = {name: symbol, quantity: quantity};

        var stockIsValid = addStockToPortfolio(newEntry, portfolio);
        if (stockIsValid) {
            // Clear newEntry to create a new empty line.
            this.setState({newEntry: {symbol: "", quantity: 0}});

            this.props.onUpdate(portfolio);
        }
    }

    onStockSelect(stock) {
        this.setState(currentState => {
            const index = currentState.selected.indexOf(stock);
            if (index < 0) {
                currentState.selected.push(stock);
            } else if (index >= 0) {
                // Remove stock from selected list.
                currentState.selected.splice(index, 1);
            }
            return currentState;
        });
    }

    onStockRemove() {
        var portfolio = this.props.portfolio;

        removeStocksFromPortfolio(this.state.selected, portfolio);
        this.setState({selected: []});
        this.props.onUpdate(portfolio);
    }

    onCurrencySwitch() {
        var portfolio = this.props.portfolio;
        switchCurrencyInPortfolio(portfolio);
        this.props.onUpdate(portfolio);
    }

    onShowGraph() {
        this.props.onShowGraph(this.props.portfolio, this.state.selected);
    }
}

class EmptyPortfolio extends React.Component {
    constructor(props) {
        super(props);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.state = {name: ""};
    }

    render() {
        const name = this.state.name;
        var addButton = <div></div>;
        if (name !== "") {
            const iconStyle = {fontSize: "192px"};

            addButton = (
                <div className="addIconWrapper">
                    <i className="fa fa-plus-circle addIcon"
                       onClick={this.handleAdd}
                       style={iconStyle} />
                </div>
            )
        }

        return (
            <div className="col-6">
                <div className="newPortfolio">
                    <input
                           type="text"
                           value={name}
                           onChange={this.handleNameChange}
                           placeholder="New portfolio" />
                    {addButton}
                </div>
            </div>
        );
    }

    handleNameChange(event) {
        const name = event.target.value;
        this.setState({name: name});
    }

    handleAdd() {
        const name = this.state.name;
        const portfolio = {
            name: name,
            currency: "eur",
            stocks: []
        }
        this.props.onAdd(portfolio);

        // Clear the input for the next portfolio.
        this.setState({name: ""});
    }
}

class StockTable extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const stocks = this.props.stocks;
        const rows = stocks.map((stock) =>
            <StockTableRow key={stock.name}
                           stock={stock}
                           currency={this.props.currency}
                           exchangeRate={this.props.exchangeRate}
                           addPrice={this.props.onSumChange}
                           onSelect={this.props.onRowSelect}
                           selected={this.props.selectedStocks.includes(stock)}/>
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
                            <th>Select</th>
                        </tr>
                        {rows}
                        {stocks.length < 50 ?
                            <EmptyStockTableRow symbol={newEntry.symbol}
                                                quantity={newEntry.quantity}
                                                onUpdate={this.props.onUpdate} /> : <div></div>}
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
        this.onSelect = this.onSelect.bind(this);
        this.state = {price: 0};
    }

    render() {
        const name = this.props.stock.name;
        const quantity = this.props.stock.quantity;

        let price = this.state.price;
        let currency = this.props.currency;
        const exchangeRate = this.props.exchangeRate;

        let total = quantity * price;

        if (currency === "eur") {
            price = price * exchangeRate;
            total = total * exchangeRate;
        }

        price = currencyRound(price);
        total = currencyRound(total);

        currency = getCurrencySymbol(currency);

        let rowStyle = {};
        if (this.props.selected) {
            rowStyle = {
                backgroundColor: "#88a0c9"
            };
        }

        return (
            <tr onClick={this.onSelect} style={rowStyle}>
                <td>{name}</td>
                <td>{price} {currency}</td>
                <td>{quantity}</td>
                <td>{total} {currency}</td>
                <td><input type="checkbox" checked={this.props.selected} /></td>
            </tr>
        );
    }

    componentDidMount() {
        const name = this.props.stock.name;
        const method = "GET",
            url = "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" + name + "&apikey=" + apiKey,
            dataType = "json";

        $.ajax({
            method: method,
            url: url,
            dataType: dataType,
            success: this.setPrice
        });
    }

    componentWillUnmount() {
        const price = this.state.price;
        const quantity = this.props.stock.quantity;
        const total = price * quantity;

        // Subtract the value of the stock from the sum.
        this.props.addPrice(-total);
    }

    setPrice(data) {
        // Catch notes in case of overusing API.
        if (data["Note"])
            return;

        const quote = data["Global Quote"];

        // Catch invalid stock name.
        if (isEmpty(quote))
            return;

        // Retrieve and round price to two decimal places.
        const price = quote["05. price"];

        const quantity = this.props.stock.quantity;
        this.setState({price: price});

        this.props.addPrice(price * quantity);
    }

    onSelect(event) {
        this.props.onSelect(this.props.stock);
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
                <td/>
                <td><input type="text"
                           value={quantity}
                           onChange={this.onQuantityChange}
                           placeholder="0" /></td>
                <td/>
                <td/>
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
        const sum = currencyRound(this.props.sum);
        const currency = getCurrencySymbol(this.props.currency);

        return (
            <p>Total value of Portfolio: {sum} {currency}</p>
        );
    }
}

class SubmitLine extends React.Component {
    render() {
        var currency = this.props.currency;
        if (currency === "eur") {
            currency = "$";
        } else {
            currency = "€";
        }

        return (
            <div>
                <button onClick={this.props.onAdd}>Add stock</button>
                <button onClick={this.props.onRemove}>Remove selected</button>
                <button onClick={this.props.onCurrencySwitch}>Show in {currency}</button>
                <button onClick={this.props.onShowGraph}>Show graph</button>
            </div>
        )
    }
}

class GraphPopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            stocks: this.props.selected,
            chartData: []
        };
    }

    render() {
        const portfolio = this.props.portfolio;

        const iconStyle = {fontSize: "32px"};

        return (
            <div className="popupWrapper">
                <div className="popup">
                    <h1>{portfolio.name}</h1>
                    <p>Not implemented.</p>
                    <i className="fa fa-times-circle closeGraph"
                       onClick={this.props.close}
                       style={iconStyle} />
                </div>
            </div>
        );
    }
}

$(document).ready(function() {
    ReactDOM.render(
        <App />,
        document.getElementById("reactRoot")
    );

    // Change close icon on hover.
    $(".closeIcon").mouseover(function() {
        $(this).removeClass("fa-times-circle").addClass("fa-close");
    });
    $(".closeIcon").mouseout(function() {
        $(this).removeClass("fa-close").addClass("fa-times-circle");
    });
});

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

function currencyRound(val) {
    val = Number(val);
    var str = val.toFixed(2);
    return Number(str);
}

function getCurrencySymbol(currency) {
    switch (currency) {
        case "eur":
            return "€";
        case "usd":
            return "$";
        default:
            return "$";
    }
}