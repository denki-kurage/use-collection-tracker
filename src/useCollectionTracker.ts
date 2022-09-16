import { useMemo, useReducer, useState } from "react";



export type ItemStateType = 'added' | 'removed' | 'attached';

export interface IItemState<T>
{
    get item(): T;
    get state(): ItemStateType;
    check(): boolean;
    undo(): void;
}


class ItemState<T> implements IItemState<T>
{
    private readonly copy: T;
    private _item: T;

    public get item(): T
    {
        return this._item;
    }

    public constructor(
        item: T,
        public state: ItemStateType = 'added',
        private equire: (a: T, b: T) => boolean
    )
    {
        this.copy = { ...item };
        this._item = item;
    }

    public check(): boolean
    {
        console.log('-----------------');
        console.log(this.item);
        console.log(this.copy);

        const v = this.equire(this.item, this.copy);
        console.log(`BOOL = ${v}`);
        console.log(this.equire);

        return this.equire(this.item, this.copy);
    }

    public undo(): void
    {
        Object.assign(<any>this._item, this.copy);
    }
}

class ItemStateCollection<T>
{
    public readonly items: ItemState<T>[] = [];

    /***
     * @param compare 両者のオブジェクトを同一視していいかをチェックします。
     * @param equal 両者の値を比較して変更があるかどうかをチェックします。
     */
    public constructor(
        private readonly equal: (a: T, b: T) => boolean,
        private readonly compare: (a: T, b: T) => boolean
    )
    {
        
    }

    public attach(item: T, state: ItemStateType)
    {
        if(!this.contains(item))
        {
            this.items.push(new ItemState(item, state, this.equal));
            return;
        }

        throw new Error('dupplicated item');
    }

    public dettach(item: T)
    {
        const index = this.indexOf(item);

        if(index !== -1)
        {
            this.items.splice(index, 1);
            return;
        }

        throw new Error('has not item');
    }

    public clear()
    {
        this.items.splice(0);
    }


    public findItem(item: T): ItemState<T> | undefined
    {
        return this.items.find(_ => this.compare(_.item, item));
    }

    private indexOf(item: T): number
    {
        return this.items.findIndex(_ => this.compare(_.item, item));
    }

    private contains(item: T): boolean
    {
        return this.items.some(_ => this.compare(_.item, item));
    }

}


class CollectionTracker<T>
{
    public readonly stateCollection: ItemStateCollection<T>;

    public constructor(
        defaultItems: T[],
        equal: (a: T, b: T) => boolean,
        compare: (a: T, b: T) => boolean)
    {
        this.stateCollection = new ItemStateCollection(equal, compare);
        this.loadItems(defaultItems);

        console.log('CollectionTracker<T> constructor!');
    }

    public loadItems(items: T[]): void
    {
        this.stateCollection.clear();
        items.forEach(_ => this.stateCollection.attach(_, 'attached'));
    }

    public addItem(item: T): boolean
    {
        const si = this.stateCollection.findItem(item);

        if(!si)
        {
            // トラッキングされていないアイテムを追加
            this.stateCollection.attach(item, 'added');
            return true;
        }
        else
        {
            // 削除されたアイテムを再追加するときは
            if(si.state === 'removed')
            {
                si.state = 'attached';
                return true;
            }
        }

        return false;
    }


    public removeItem(item: T): boolean
    {
        const si = this.stateCollection.findItem(item);
        if(si)
        {
            // Attachedの場合は削除フラグへ変更
            if(si.state === 'attached')
            {
                si.state = 'removed';
                return true;
            }

            // 新規追加アイテムを削除する時はDettach
            if(si.state === 'added')
            {
                this.stateCollection.dettach(item);
                return true;
            }
        }

        return false;
    }

    public getAllItems(): IItemState<T>[]
    {
        return this.stateCollection.items;
    }

}

export interface ITrackingItems<T>
{
    get removedItems(): T[];
    get addedItems(): T[];
    get changedItems(): T[];
}

export function useCollectionTracker<T>(
    defaultItems: T[],
    equal: (a: T, b: T) => boolean,
    compare: (a: T, b: T) => boolean = (a, b) => a === b)
{
    const [ignored, forceUpdate] = useReducer(_ => _ + 1, 0);

    const tracker = useMemo(() => new CollectionTracker(defaultItems, equal, compare), []);

    const add = (item: T) =>
    {
        tracker.addItem(item);
        forceUpdate();
    }

    const remove = (item: T) =>
    {
        tracker.removeItem(item);
        forceUpdate();
    }

    const undo = (item: T) =>
    {
        const s = tracker.stateCollection.findItem(item);
        if(s)
        {
            s.undo();
            forceUpdate();
            return true;
        }
        
        return false;
    }

    const change = () =>
    {
        forceUpdate();
    }

    const load = (items: T[] = []) =>
    {
        tracker.loadItems(items);
        forceUpdate();
    }

    const getTrackingItems: () => ITrackingItems<T> = () =>
    {
        const saveItems: ITrackingItems<T> = {
            addedItems: [],
            removedItems: [],
            changedItems: []
        }

        for(const si of tracker.getAllItems())
        {
            const item = si.item;
            switch(si.state)
            {
                case 'added': saveItems.addedItems.push(item); break;
                case 'removed': saveItems.removedItems.push(item); break;
                case 'attached':
                    if(!si.check())
                    {
                        saveItems.changedItems.push(item);
                        break;
                    }
            }
        }
        
        return saveItems;
    }

    const items = tracker.getAllItems();

    return { items, add, remove, change, undo, load, getTrackingItems };

}




