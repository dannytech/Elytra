import { Server as HTTPServer } from "http";
import { createHandler } from "graphql-http/lib/use/http";
import { buildSchema, ObjectType, Resolver, Query, Field } from "type-graphql";
import { Logging } from "./game/Logging";

@ObjectType()
class DummyType {
    @Field()
    booleanValue: boolean;
}

@Resolver()
class EmptyResolver {
  @Query(() => DummyType)
  emptyQuery(): DummyType {
    return {
        booleanValue: true
    };
  }
}

export class API {
    public static async Bootstrap(): Promise<HTTPServer> {
        // Compile GraphQL schema
        const schema = await buildSchema({
            resolvers: [EmptyResolver]
        });

        // Set up GraphQL handler
        const handler = createHandler({ schema });

        // Bootstrap a basic HTTP server
        return new HTTPServer((req, res) => {
            // Basic request logging
            Logging.Debug(
                `[${new Date().toISOString()}]`,
                req.method,
                req.url,
                `${req.socket.remoteAddress}:${req.socket.remotePort}`
            );

            // Server just the GraphQL API endpoint
            if (req.url.startsWith("/graphql"))
                handler(req, res);
            else
                res.writeHead(404).end();
        });
    }
}
