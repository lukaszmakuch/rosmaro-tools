import another from './anotherFile';

export default (opts) => ({'main:B got': opts, 'main:B imported': another});