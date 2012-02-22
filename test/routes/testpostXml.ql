val = select * from testing.for.post;
return {
"val" : "{val}"
} via route "/ping/pongxml" using method post;