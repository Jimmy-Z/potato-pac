
potato routing in a PAC

* introduction:
	* [potato routing](https://github.com/Jimmy-Z/potato-routing)
	* internally the PAC resolves the host to IP by calling `dnsResolve()`.
	* expect to work with SOCKS5 proxies.
* example
	```
	deno run --allow-net=0.0.0.0:8080 --allow-run=curl --allow-read=hosts.conf,routes.lst --allow-write=routes.lst main.ts srv
	```
* notes:
	* to reload PAC, disable then re-enable PAC.
		* copy the URL beforehand.
		* killing the browser doesn't seem to work.