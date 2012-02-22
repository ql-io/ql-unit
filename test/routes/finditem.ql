items = select * from ebay.finding.items where keywords = "{keywords}"
return items via route "/finditems/{keywords}" using method get;