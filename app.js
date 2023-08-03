// Escolhe cor para os tipo de pokémon
// se a função for chamada sem passar nenhum valor, será retornado o valor 'undefined' porque não tem um objeto com nome 'undefined' nela, e quando o valor for 'undefined' ele se tornará o valor 'normal' que eh a const lá encima, ou seja, se não passar nada como parâmetro, o valor dela será a constante 'normal'.
const getTypeColor = type => 
{
  const normal = '#F5F5F5'
  return {
    normal,
    fire: '#FDDFDF',
    grass: '#DEFDE0',
    electric: '#FCF7DE',
    ice: '#DEF3FD',
    water: '#DEF3FD',
    ground: '#F4E7DA',
    rock: '#D5D5D4',
    fairy: '#FCEAFF',
    poison: '#98D7A5',
    bug: '#F8D5A3',
    ghost: '#CAC0F7',
    dragon: '#97B3E6',
    psychic: '#EAEDA1',
    fighting: '#E6E0D4'
  }[type] || normal
}

const getPokemonsType = async pokeApiResults => 
{
    const fulfilled = await getOnlyFulfilled({arr: pokeApiResults, func: result => fetch(result.url)});
    const pokePromises = fulfilled.map(url => url.value.json());
    const pokemons = await Promise.all(pokePromises);
    return pokemons.map(fulfilled => fulfilled.types.map(info => DOMPurify.sanitize(info.type.name)));
};

const getPokemonsIds = pokeApiResults => pokeApiResults.map(({ url }) => 
{
  const urlAsArray = DOMPurify.sanitize(url).split('/');
  return urlAsArray[urlAsArray.length - 2];
});

const getPokemonsImgs = async ids => 
{
  const fulfilled = await getOnlyFulfilled({arr: ids, func: id => fetch(`./assets/img/${id}.png`)});
  return fulfilled.map(response => response.value.url);
}

const getOnlyFulfilled = async ({ arr, func }) =>
{
    const promises = arr.map(func);
    const responses = await Promise.allSettled(promises);
    return responses.filter(response => response.status === 'fulfilled');
}

const paginationInfo = (() => 
{
  const limit = 15;
  let offset = 0;

  const getLimit = () => limit;
  const getOffset = () => offset;
  const incrementOffset = () => offset += limit;

  return { getLimit, getOffset, incrementOffset }
})()

const getPokemons = async () =>
{
  try
  {
    const { getLimit, getOffset, incrementOffset } = paginationInfo;
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${getLimit()}&offset=${getOffset()}`);
    if (!response.ok)
    {
      throw new error('Não foi possível obter as informações');
    }
    const { results: pokeApiResults } = await response.json()
    const types = await getPokemonsType(pokeApiResults);
    const ids = getPokemonsIds(pokeApiResults);
    const imgs = await getPokemonsImgs(ids);
    const pokemons = ids.map((id, i) => ({ id, name: pokeApiResults[i].name, types: types[i], imgUrl: imgs[i] }));
  
    incrementOffset()
    return pokemons;    
  }
  catch (error)
  {
    console.log('Algo deu errado!', error);
  }
}

const renderPokemons = pokemons =>
{
  const ul = document.querySelector('[data-js="pokemons-list"]');
  const fragment = document.createDocumentFragment();

  pokemons.forEach(({ id, name, types, imgUrl }) => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    const nameConteiner = document.createElement('h2');
    const typeConteiner = document.createElement('p');
    const [firstType] = types;

    img.setAttribute('src', imgUrl);
    img.setAttribute('alt', name);
    img.setAttribute('class', 'card-image');
    li.setAttribute('class', `card ${firstType}`);
    li.style.setProperty('--type-color', getTypeColor(firstType));
    nameConteiner.textContent = `${id}. ${name[0].toUpperCase()}${name.slice(1)}`;
    typeConteiner.textContent = types.length > 1 ? types.join(' | ') : firstType;
    li.append(img, nameConteiner, typeConteiner);

    fragment.append(li);
    
  });

  ul.append(fragment);
}

const observeLastPokemon = pokemonObserver =>
{
  const lastPokemon = document.querySelector('[data-js="pokemons-list"]').lastChild;
  pokemonObserver.observe(lastPokemon);
}

const renderNextPokemons = () =>
{
  const pokemonObserver = new IntersectionObserver(async ([lastPokemon], observer) => 
    {
      if (!lastPokemon.isIntersecting)
      {
        return
      }

      observer.unobserve(lastPokemon.target);

      if (paginationInfo.getOffset() === 150)
      {
        return
      }

      const pokemons = await getPokemons();
      renderPokemons(pokemons);
      observeLastPokemon(pokemonObserver);
    }, { rootMargin: '500px' });

    observeLastPokemon(pokemonObserver);
  
}

const handlePageLoaded = async () => 
{
  const pokemons = await getPokemons();
  renderPokemons(pokemons);
  renderNextPokemons();
}

handlePageLoaded();