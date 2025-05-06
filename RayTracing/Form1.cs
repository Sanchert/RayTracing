using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Runtime.InteropServices.ComTypes;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

using OpenTK;
using OpenTK.Graphics.OpenGL;
using OpenTK.Platform.MacOS;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;

namespace RayTracing
{
    public partial class Form1 : Form
    {
       
        bool loaded = false;
        
        public Form1()
        {
            InitializeComponent();
        }

        private void glControl1_Load(object sender, EventArgs e)
        {
            loaded = true;
            View.SetupView(glControl1.Width, glControl1.Height);
            View.InitShaders();
            View.DrawQuad(); 
        }

        private void glControl1_Paint(object sender, PaintEventArgs e)
        {
            if (loaded)
            {
                GL.Viewport(0, 0, glControl1.Width, glControl1.Height);
                View.ReDraw();
                glControl1.SwapBuffers();
            }
        }
    }
}
