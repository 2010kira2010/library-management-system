import { createContext, useContext } from 'react';
import { makeAutoObservable } from 'mobx';
import AuthStore from './AuthStore';
import BookStore from './BookStore';
import ReaderStore from './ReaderStore';
import LoanStore from './LoanStore';
import UIStore from './UIStore';
import AuthorStore from './AuthorStore';
import PublisherStore from './PublisherStore';
import DiskStore from './DiskStore';
import SettingsStore from './SettingsStore';
import api from '../services/api';

class RootStore {
    authStore: AuthStore;
    bookStore: BookStore;
    readerStore: ReaderStore;
    loanStore: LoanStore;
    uiStore: UIStore;
    authorStore: AuthorStore;
    publisherStore: PublisherStore;
    diskStore: DiskStore;
    settingsStore: SettingsStore;
    apiClient: typeof api;

    constructor() {
        this.authStore = new AuthStore(this);
        this.bookStore = new BookStore(this);
        this.readerStore = new ReaderStore(this);
        this.loanStore = new LoanStore(this);
        this.uiStore = new UIStore(this);
        this.authorStore = new AuthorStore(this);
        this.publisherStore = new PublisherStore(this);
        this.diskStore = new DiskStore(this);
        this.settingsStore = new SettingsStore(this);
        this.apiClient = api;
        makeAutoObservable(this);
    }
}

const rootStore = new RootStore();
const RootStoreContext = createContext(rootStore);

export const useRootStore = () => {
    const store = useContext(RootStoreContext);
    if (!store) {
        throw new Error('useRootStore must be used within a RootStoreProvider');
    }
    return store;
};

export default rootStore;