import React, { ReactNode, useDeferredValue, useEffect, useState } from "react";
import { ItemStateType, useCollectionTracker } from "./useCollectionTracker";
import './TrackerComponent.scss';


interface Product
{
    id: number;
    name: string;
    price: number;
}

const products2: Product[] = [
    { id: 1, name: 'あたりめ', price: 320 },
    { id: 2, name: 'チーズ', price: 250 },
    { id: 3, name: 'つぶがい', price: 500 },
    { id: 4, name: 'サラミ', price: 170 },
    { id: 5, name: 'めかぶ', price: 300 },
    { id: 6, name: 'ししゃも', price: 410 }
];


const products: Product[] = [
    { id: 1, name: 'AAA', price: 320 },
    { id: 2, name: 'BBB', price: 250 },
    { id: 3, name: 'CCC', price: 500 },
    { id: 4, name: 'DDD', price: 170 },
    { id: 5, name: 'EEE', price: 300 },
];


const ProductEditFormTable = ({ children }: { children: ReactNode }) =>
{
    return (
    <table width="100%">
        <thead>
            <tr>
                <th>state</th>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Commands</th>
            </tr>
        </thead>
        <tbody>
            { children }
        </tbody>
    </table>
    )
}

interface IProductEditFormProps
{
    state?: ItemStateType | 'changed';
    product: Product;
    commands: Array<[string, (product: Product) => void]>;
    onChanged?: () => void;
}


const ProductEditForm = ({ state, product, commands, onChanged }: IProductEditFormProps) =>
{
    const [name, setName] = useState(product.name ?? '');
    const [price, setPrice] = useState<string>(product.price?.toString() ?? '');

    const d1 = useDeferredValue(name);
    const d2 = useDeferredValue(price);

    // Stateの変更をオブジェクトへ遅延反映
    useEffect(() => {
        product.name = name;
        product.price = parseInt(price) || 0;
        onChanged?.();
    }, [d1, d2]);

    //  オブジェクトの変更をStateへ反映(するといろいろ不都合があるので出来ない)
    //  useEffect(() => {
    //      setName(product.name);
    //      setPrice(product.price);
    //  }, [product.name, product.price]);

    const reRender = (product: Product) =>
    {
        setName(product.name);
        setPrice(product.price.toString());
    }

    // addで新しい空のインスタンスが設定されたとき
    useEffect(() => {
        setName(product.name);
        setPrice(product.price.toString());
    }, [product]);


    return (
        <tr className={state}>
            <td>
                <b>({state || 'none'})</b>
            </td>
            <td>
                {product.id}
            </td>
            <td>
                <input type="text" value={name} onChange={e => setName(e.target.value) } />
            </td>
            <td>
                <input type="text" value={price} onChange={e => setPrice(e.target.value)} />
            </td>
            <td>
                {
                    commands.map(_ => {
                        return <input type="button" value={_[0]} onClick={e => { _[1](product); reRender(product); } } />
                    })
                }
            </td>
        </tr>
    )
}



// ここはちょっと後で考える。
let idCount = products.length + 1;


const createEmptyProduct: () => Product = () =>
{
    return ({ id: 0, name: '', price: 0 });
}

const TrackerComponent = () =>
{
    const [productAddObject, setProductAddProject] = useState<Product>(createEmptyProduct());

    // Trackerの使用
    const tracker = useCollectionTracker<Product>(
        [...products],
        (a, b) => a.id === b.id && a.name === b.name && a.price === b.price
    );
    
    const items = tracker.items;
    const trackingItems = tracker.getTrackingItems();

    const onAdd = (item: Product) =>
    {
        setProductAddProject(createEmptyProduct());
        tracker.add({ id: idCount++, name: item.name, price: item.price });
    }

    const onChange = () => tracker.change();
    const onRemove = (item: Product) => tracker.remove(item);
    const undo = (item: Product) => tracker.undo(item);
    const reAttach = (item: Product) => tracker.add(item);

    const saveChanges = () =>
    {
        // ここでデータベースに反映させる
        const { addedItems, changedItems, removedItems } = trackingItems;

        // いったんクリア
        tracker.load([...products]);
    }

    return (
        <div className="tracking-panel">

            <input type="button" value="Save changed" className="save-button" onClick={e => saveChanges()} />


            <h2>追加フォーム</h2>
            <div>
                <ProductEditFormTable>
                    <ProductEditForm product={productAddObject} commands={[['追加', (product) => onAdd(product)]]} />
                </ProductEditFormTable>
            </div>

            <h2>編集フォーム</h2>
            <ProductEditFormTable>
            {
                // items 一覧
                items.map(_ => {
                    const {state, item} = _;
                    
                    const newState = (state === 'attached' && !_.check()) ? 'changed' : state;

                    return (
                        <ProductEditForm
                            key={item.id}
                            state={newState}
                            product={item}
                            commands={[['初期値に戻す', p => undo(item)], ['削除', p => onRemove(item)]]}
                            onChanged={() => onChange()}
                            />
                    )
                })
            }
            </ProductEditFormTable>


            <h2>トラッキング情報</h2>
            <table width="100%">
                <thead>
                    <tr>
                        <th>新規追加</th>
                        <th>更新項目</th>
                        <th>削除項目</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <ul>
                            {
                                trackingItems.addedItems.map(_ => {
                                    return (
                                        <li key={_.id}>{_.name}({_.price})</li>
                                    )
                                })
                            }
                            </ul>
                        </td>
                        <td>
                            <ul>
                            {
                                trackingItems.changedItems.map(_ => {
                                    return (
                                        <li key={_.id}>{_.name}({_.price})</li>
                                    )
                                })
                            }
                            </ul>
                        </td>
                        <td>
                            <ul>
                            {
                                trackingItems.removedItems.map(_ => {
                                    return (
                                        <li key={_.id}>
                                            {_.name}({_.price})
                                            <input type="button" value="やっぱ削除しない" onClick={e => reAttach(_)}/>
                                        </li>
                                    )
                                })
                            }
                            </ul>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default TrackerComponent;