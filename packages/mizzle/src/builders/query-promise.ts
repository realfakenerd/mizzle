export abstract class QueryPromise<T> implements Promise<T> {
    [Symbol.toStringTag] = "QueryPromise";

    catch<TResult = never>(
        onrejected?:
            | ((reason: unknown) => TResult | PromiseLike<TResult>)
            | null
            | undefined,
    ): Promise<T | TResult> {
        return this.then(undefined, onrejected);
    }

    finally(onfinally?: (() => void) | null | undefined): Promise<T> {
        return this.then(
            (value) => {
                onfinally?.();
                return value;
            },
            (reason) => {
                onfinally?.();
                throw reason;
            },
        );
    }

    // oxlint-disable
    then<TResult1 = T, TResult2 = never>(
        onfulfilled?:
            | ((value: T) => TResult1 | PromiseLike<TResult1>)
            | null
            | undefined,
        onrejected?:
            | ((reason: unknown) => TResult | PromiseLike<TResult>)
            | null
            | undefined,
    ): Promise<TResult1 | TResult2> {
        return this.execute().then(onfulfilled, onrejected);
    }

    abstract execute(): Promise<T>;
}
