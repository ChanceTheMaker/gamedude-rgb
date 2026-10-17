#include <stddef.h>
void *memset(void *p,int v,size_t n) {unsigned char *d=p;while(n--)*d++=(unsigned char)v;return p;}
void *memcpy(void *p,const void *q,size_t n) {unsigned char *d=p;const unsigned char*s=q;while(n--)*d++=*s++;return p;}
int memcmp(const void *p,const void*q,size_t n) {const unsigned char*a=p,*b=q;while(n--){if(*a!=*b)return *a-*b;a++;b++;}return 0;}
void abort(void) {__builtin_trap();}
/* The core sorts at most ten sprites. Stable insertion sort needs no heap. */
void qsort(void *base,size_t count,size_t size,int (*compare)(const void *,const void *)) {
    unsigned char *b=base;
    for(size_t i=1;i<count;i++)for(size_t j=i;j>0&&compare(b+(j-1)*size,b+j*size)>0;j--)
        for(size_t k=0;k<size;k++){unsigned char t=b[(j-1)*size+k];b[(j-1)*size+k]=b[j*size+k];b[j*size+k]=t;}
}
