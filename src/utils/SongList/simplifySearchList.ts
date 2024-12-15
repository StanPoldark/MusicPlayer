export default function simplifySearchResult(
    val: { [propName: string]: any },
    filterList: string[],
  ) {
    
    const newVal: { [propName: string]: any } = {};
    for (let i = 0; i < filterList.length; i++) {
      const name = filterList[i];
      newVal[name] = val[name];
    }
  
    return newVal;
  }
  