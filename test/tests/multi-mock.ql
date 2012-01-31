
create table plusxml
  on select get from "http://localhost:3000/test";

create table itemjson
  on select get from "http://localhost:3026/test";

resp1 = select * from plusxml;
resp2 = select * from itemjson;

return {
"resp1": "{resp1}",
"resp2": "{resp2}"
}

