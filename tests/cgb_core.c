#include <assert.h>
#include <stdio.h>
#include "../src/gb_port.c"
int main(void){
    static uint8_t rom[32768];rom[0x143]=0xc0;
    for(unsigned i=0x134;i<0x14d;i++)rom[0x14d]=(uint8_t)(rom[0x14d]-rom[i]-1);
    assert(gp_load(rom,sizeof rom)==GP_OK&&gp_color_mode());
    for(unsigned b=1;b<8;b++){__gb_write(&gb,0xff70,b);__gb_write(&gb,0xd000,0x40+b);}
    for(unsigned b=1;b<8;b++){__gb_write(&gb,0xff70,b);assert(__gb_read(&gb,0xd000)==0x40+b);}
    __gb_write(&gb,0xff70,0);assert(__gb_read(&gb,0xd000)==0x41);
    for(unsigned b=0;b<2;b++){__gb_write(&gb,0xff4f,b);__gb_write(&gb,0x8000,0x60+b);}
    for(unsigned b=0;b<2;b++){__gb_write(&gb,0xff4f,b);assert(__gb_read(&gb,0x8000)==0x60+b);}
    __gb_write(&gb,0xff40,0);__gb_write(&gb,0xff4f,1);
    for(unsigned i=0;i<32;i++)__gb_write(&gb,0xc100+i,i+3);
    __gb_write(&gb,0xff51,0xc1);__gb_write(&gb,0xff52,0);__gb_write(&gb,0xff53,0);__gb_write(&gb,0xff54,0x20);__gb_write(&gb,0xff55,1);
    for(unsigned i=0;i<32;i++)assert(__gb_read(&gb,0x8020+i)==i+3);
    __gb_write(&gb,0xff68,0x80);__gb_write(&gb,0xff69,0x1f);__gb_write(&gb,0xff69,0);
    assert(gb.cgb.BGPaletteID==2&&gb.cgb.fixPalette[0]==0x7c00);
    rom[0x150]=0x10;rom[0x151]=0;gb.cpu_reg.pc.reg=0x150;__gb_write(&gb,0xff4d,1);__gb_step_cpu(&gb);assert(gb.cgb.doubleSpeed==1);
    gb.cpu_reg.pc.reg=0x150;__gb_write(&gb,0xff4d,1);__gb_step_cpu(&gb);assert(gb.cgb.doubleSpeed==0);
    gp_reset();assert(gp_color_mode()&&gb.cgb.doubleSpeed==0);
    /* A cartridge may leave LCD disabled across multiple host frames. */
    rom[0x150]=0x18;rom[0x151]=0xfe;gb.cpu_reg.pc.reg=0x150;__gb_write(&gb,0xff40,0);
    for(unsigned f=0;f<3;f++){assert(gp_frame());gp_audio_read(pcm,740);}
    assert(gp_frame_count()==3&&gb.hram_io[IO_LY]==0);
    puts("PASS: CGB WRAM/VRAM banks, GDMA, palette auto-increment, double-speed STOP and reset");
}
