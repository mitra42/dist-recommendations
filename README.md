# Distributed Recommenation engine

The basic idea came from a concept used in fields like handwriting recognition. 

Objects are distributed in an n-dimensional space, 
and a "query" is a request for objects close to a specific point in that space. 
Like's are a process of moving objects closer to the query and vica-versa,
effectively moving items that are liked by the same people close to each other.


## Concepts

* N-Dimensions - while we are exploring an n-dimensional space, 
  so each point is represented by a n-tuple where each dimension is represented by 0..1
  for practical implementations a binary method is used,
  so each point is n bits representing n dimensions
  and distance is the number of different bits.
* Inertia - an object or query gets "heavier" and harder to move 
  as its position is confirmed by more queries. 

## API
Presume a client has a number X which defines what its looking for.

The API between clients and servers (still a straw-person proposal)

A typical scenario - lets assume dating ... 

* Client requests a random set: Find(maxResults:10)
* Server sends 10 items
* Client UX selects which ones it likes or doesnt
* Client calculates a point that is at the center of the liked points
* Client responds to server with this new point:
  Adjust(X,[key, +-]*)
* Server may make adjustments to the keys of these points.
* Client requests new list based on its key: Find(X, 10)
* Server picks new set based on that key.
* Client UX selects from this set, adjusting its key as it goes
* Clients sends Adjust & Find and repeats

Work out scenario where looking at pictures and categorizing based on close to other images

#### Find(X, maxresults: s) -> [Y,inertia]*0..s
Request up to n results that are close to X
key: n bit key (optional) The point in n-dimensional space looking for neighbors of
maxResults: int     The requested number of results

Returns an array of points. 
query:              The query requested (allows asynchronous responses)
results: [
    key: n-bit-key
    inertia: n      Representation (TBD) of inertia
    url             Identification of the item
]

If key is omitted then a list of at most maxresults points is returned.
