:POST /reservation

1. check event exist or not
2. check the seats availability
3. check if the seats are held or confirmed
4. if seats are available then create reservation
5. create resesrvation seat record
6. return reservation

## row locking visualization

* without locking
```
Request A                 Request B
---------                 ---------

Check A1 ✅
                           Check A1 ✅

Check reservation ✅
                           Check reservation ✅

Create reservation ✅
                           Create reservation ❌ (double booking)
```                        
* with row locking
```
Request A                 Request B
---------                 ---------

LOCK A1 🔒

                           tries to LOCK A1
                           ↓
                           WAIT

check reservation

create reservation

COMMIT

                           wakes up

                           checks reservation

                           finds A1 reserved

                           FAILS

```