import { Server as HTTPServer } from "http";
import { ApolloServer } from "@apollo/server";
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
    public static async Bootstrap(): Promise<ApolloServer> {
        // Compile GraphQL schema
        const schema = await buildSchema({
            resolvers: [EmptyResolver]
        });

        // Set up GraphQL handler
        return new ApolloServer({
            schema
        });
    }
}
