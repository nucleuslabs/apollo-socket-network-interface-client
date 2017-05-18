# Apollo Socket Network Interface (Client)

Apollo-GraphQL network interface for sockets. 

Enables high-performance communication without the overhead of HTTP.

## Example

```js
import {ApolloClient} from 'apollo-client';
import LocalNetworkInterface from 'apollo-socket-network-interface-client';

export default new ApolloClient({
    networkInterface: new LocalNetworkInterface({
        path: '/tmp/your-service.sock'
    })
});
```

## License

MIT.